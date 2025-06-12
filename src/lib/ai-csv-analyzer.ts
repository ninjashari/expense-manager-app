import OpenAI from 'openai';

export interface AnalysisResult {
  dataType: 'transactions' | 'accounts' | 'categories' | 'mixed' | 'unknown';
  columnMappings: Record<string, string>;
  confidence: number;
  suggestions: string[];
  warnings: string[];
  detectedColumns: string[];
}

export class CSVAnalyzer {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for CSV analysis');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeCSV(csvData: any[], fileName: string): Promise<AnalysisResult> {
    try {
      if (!csvData || csvData.length === 0) {
        throw new Error('No CSV data provided for analysis');
      }

      const headers = Object.keys(csvData[0]);
      const sampleRows = csvData.slice(0, Math.min(5, csvData.length));

      const prompt = this.buildAnalysisPrompt(headers, sampleRows, fileName);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial data analyst. Analyze CSV data for a personal expense management application and provide column mapping suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI analysis');
      }

      return this.parseAIResponse(result, headers);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackAnalysis(csvData);
    }
  }

  private buildAnalysisPrompt(headers: string[], sampleRows: any[], fileName: string): string {
    return `
Analyze this CSV file for a personal expense management application.

File Name: ${fileName}
CSV Headers: ${headers.join(', ')}

Sample Data Rows:
${sampleRows.map((row, index) => `Row ${index + 1}: ${JSON.stringify(row)}`).join('\n')}

Database Schema Options:

1. TRANSACTIONS:
   - date (required): Transaction date
   - type (required): "Income" or "Expense"
   - amount (required): Monetary amount (positive number)
   - payee (required): Who the transaction was with
   - account (required): Reference to account name/id
   - category (optional): Reference to category name/id
   - notes (optional): Additional notes

2. ACCOUNTS:
   - name (required): Account name
   - type (required): "Checking", "Savings", "Credit Card", "Cash", "Investment"
   - currency (required): Currency code (e.g., "USD", "INR")
   - balance (optional): Current balance

3. CATEGORIES:
   - name (required): Category name
   - type (required): "Income" or "Expense"

Please analyze and respond with ONLY a JSON object in this exact format:
{
  "dataType": "transactions|accounts|categories|mixed|unknown",
  "columnMappings": {
    "csv_column_name": "database_field_name"
  },
  "confidence": 0-100,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "warnings": ["warning 1", "warning 2"],
  "detectedColumns": ["list", "of", "csv", "headers"]
}

Rules:
- Only map columns that clearly match database fields
- Confidence should be 0-100 based on how certain you are
- Include suggestions for improving data quality
- Warn about potential issues (missing required fields, format problems, etc.)
- If multiple data types are detected, use "mixed"
- If unsure about the data type, use "unknown"
`;
  }

  private parseAIResponse(response: string, headers: string[]): AnalysisResult {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      const result: AnalysisResult = {
        dataType: parsed.dataType || 'unknown',
        columnMappings: parsed.columnMappings || {},
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        detectedColumns: headers,
      };

      // Validate that mapped columns exist in the CSV
      const validMappings: Record<string, string> = {};
      for (const [csvCol, dbField] of Object.entries(result.columnMappings)) {
        if (headers.includes(csvCol)) {
          validMappings[csvCol] = dbField;
        }
      }
      result.columnMappings = validMappings;

      return result;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private getFallbackAnalysis(csvData: any[]): AnalysisResult {
    const headers = Object.keys(csvData[0] || {});
    
    // Simple heuristic-based analysis as fallback
    const mappings: Record<string, string> = {};
    let dataType: AnalysisResult['dataType'] = 'unknown';
    
    // Common patterns for transaction data
    const transactionPatterns = {
      date: /date|time|when/i,
      amount: /amount|value|sum|total|price|cost/i,
      payee: /payee|merchant|vendor|description|desc/i,
      type: /type|category|kind/i,
      account: /account|bank/i,
      notes: /note|memo|comment|description/i,
    };

    // Check for transaction patterns
    let transactionScore = 0;
    headers.forEach(header => {
      for (const [field, pattern] of Object.entries(transactionPatterns)) {
        if (pattern.test(header)) {
          mappings[header] = field;
          transactionScore++;
        }
      }
    });

    if (transactionScore >= 3) {
      dataType = 'transactions';
    }

    return {
      dataType,
      columnMappings: mappings,
      confidence: Math.min(transactionScore * 20, 80), // Lower confidence for fallback
      suggestions: [
        'AI analysis was not available, using pattern matching',
        'Please review and adjust the column mappings manually',
      ],
      warnings: [
        'Automatic analysis failed, mappings may be inaccurate',
        'Verify all required fields are mapped correctly',
      ],
      detectedColumns: headers,
    };
  }
} 