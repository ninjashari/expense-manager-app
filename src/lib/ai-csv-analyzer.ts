export interface AnalysisResult {
  dataType: 'transactions' | 'accounts' | 'categories' | 'mixed' | 'unknown';
  columnMappings: Record<string, string>;
  confidence: number;
  suggestions: string[];
  warnings: string[];
  detectedColumns: string[];
}

// Declare puter as global for TypeScript
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<string>;
      };
    };
  }
}

export class CSVAnalyzer {
  constructor() {
    // No API key needed - Puter.js handles everything
  }

  async analyzeCSV(csvData: Record<string, unknown>[], fileName: string): Promise<AnalysisResult> {
    try {
      if (!csvData || csvData.length === 0) {
        throw new Error('No CSV data provided for analysis');
      }

      const headers = Object.keys(csvData[0]);
      
      // Try AI analysis first if Puter.js is available
      if (typeof window !== 'undefined' && window.puter?.ai) {
        try {
          return await this.performAIAnalysis(headers, csvData, fileName);
        } catch (error) {
          console.warn('AI analysis failed, falling back to pattern matching:', error);
        }
      }

      // Use enhanced pattern matching as fallback
      return this.getEnhancedPatternAnalysis(csvData, fileName);
    } catch (error) {
      console.error('CSV analysis failed:', error);
      return this.getBasicFallbackAnalysis(csvData);
    }
  }

  private async performAIAnalysis(headers: string[], csvData: Record<string, unknown>[], fileName: string): Promise<AnalysisResult> {
    const sampleRows = csvData.slice(0, Math.min(3, csvData.length));
    const prompt = this.buildAnalysisPrompt(headers, sampleRows, fileName);

    const response = await window.puter!.ai.chat(prompt, { model: 'gpt-4o-mini' });
    
    return this.parseAIResponse(response, headers) || this.getEnhancedPatternAnalysis(csvData, fileName);
  }

  private buildAnalysisPrompt(headers: string[], sampleRows: Record<string, unknown>[], fileName: string): string {
    return `Analyze CSV file "${fileName}" with headers: ${headers.join(', ')}. Sample: ${JSON.stringify(sampleRows[0] || {})}. 
    
Respond with JSON only:
{
  "dataType": "transactions|accounts|categories|unknown",
  "columnMappings": {"csv_column": "db_field"},
  "confidence": 85,
  "suggestions": ["tip1"],
  "warnings": ["warning1"]
}

Database fields:
- Transactions: date, type, amount, payee, account, category, notes
- Accounts: name, type, currency, balance
- Categories: name, type`;
  }

  private parseAIResponse(response: string, headers: string[]): AnalysisResult | null {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        dataType: parsed.dataType || 'unknown',
        columnMappings: parsed.columnMappings || {},
        confidence: Math.max(0, Math.min(100, parsed.confidence || 0)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        detectedColumns: headers,
      };
    } catch (error) {
      console.warn('Failed to parse AI response:', error);
      return null;
    }
  }

  private getEnhancedPatternAnalysis(csvData: Record<string, unknown>[], fileName: string): AnalysisResult {
    const headers = Object.keys(csvData[0] || {});
    const sampleRow = csvData[0] || {};
    
    // Enhanced pattern matching with data type detection
    const mappings: Record<string, string> = {};
    let dataType: AnalysisResult['dataType'] = 'unknown';
    const suggestions: string[] = [];
    const warnings: string[] = [];
    
    // Transaction patterns (most common use case)
    const transactionPatterns = {
      date: /date|time|when|day|created|posted/i,
      amount: /amount|value|sum|total|price|cost|debit|credit|balance/i,
      payee: /payee|merchant|vendor|description|desc|name|company|store/i,
      type: /type|category|kind|class|income|expense/i,
      account: /account|bank|card|wallet/i,
      notes: /note|memo|comment|remark|detail/i,
    };

    // Account patterns
    const accountPatterns = {
      name: /name|title|account|label/i,
      type: /type|kind|category|class/i,
      currency: /currency|curr|money|symbol/i,
      balance: /balance|amount|total|value/i,
    };

    // Category patterns
    const categoryPatterns = {
      name: /name|title|category|label/i,
      type: /type|kind|income|expense/i,
    };

    // Score each data type
    let transactionScore = 0;
    let accountScore = 0;
    let categoryScore = 0;

    headers.forEach(header => {
      const sampleValue = String(sampleRow[header] || '').toLowerCase();

      // Check transaction patterns
      for (const [field, pattern] of Object.entries(transactionPatterns)) {
        if (pattern.test(header)) {
          mappings[header] = field;
          transactionScore++;
          
          // Additional validation based on sample data
          if (field === 'amount' && sampleValue && !isNaN(Number(sampleValue.replace(/[^0-9.-]/g, '')))) {
            transactionScore += 0.5;
          }
          if (field === 'date' && this.isDateLike(sampleValue)) {
            transactionScore += 0.5;
          }
        }
      }

      // Check account patterns
      for (const [fieldName, pattern] of Object.entries(accountPatterns)) {
        if (pattern.test(header)) {
          accountScore++;
          if (fieldName === 'type' && /checking|savings|credit|cash|investment/i.test(sampleValue)) {
            accountScore += 0.5;
          }
        }
      }

      // Check category patterns
      for (const [, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(header)) {
          categoryScore++;
        }
      }
    });

    // Determine data type based on scores
    if (transactionScore >= 3) {
      dataType = 'transactions';
      suggestions.push('Detected transaction data - ensure date and amount formats are consistent');
      if (!mappings.date) warnings.push('No date column detected - this is required for transactions');
      if (!mappings.amount) warnings.push('No amount column detected - this is required for transactions');
      if (!mappings.payee) warnings.push('No payee/description column detected - this is required for transactions');
    } else if (accountScore >= 2) {
      dataType = 'accounts';
      suggestions.push('Detected account data - verify account types and currency codes');
    } else if (categoryScore >= 1) {
      dataType = 'categories';
      suggestions.push('Detected category data - ensure category types are specified');
    } else {
      dataType = 'unknown';
      warnings.push('Could not determine data type automatically');
      suggestions.push('Please manually map columns to appropriate fields');
    }

    // File name hints
    const fileNameLower = fileName.toLowerCase();
    if (fileNameLower.includes('transaction') || fileNameLower.includes('expense') || fileNameLower.includes('income')) {
      if (dataType === 'unknown') {
        dataType = 'transactions';
        suggestions.push('File name suggests transaction data');
      }
    } else if (fileNameLower.includes('account') || fileNameLower.includes('bank')) {
      if (dataType === 'unknown') {
        dataType = 'accounts';
        suggestions.push('File name suggests account data');
      }
    }

    // Calculate confidence based on matches and data quality
    const maxPossibleScore = dataType === 'transactions' ? 6 : dataType === 'accounts' ? 4 : 2;
    const actualScore = dataType === 'transactions' ? transactionScore : 
                       dataType === 'accounts' ? accountScore : categoryScore;
    const confidence = Math.min(Math.round((actualScore / maxPossibleScore) * 100), 95);

    // Add general suggestions
    suggestions.push('Review column mappings before importing');
    if (csvData.length > 1000) {
      suggestions.push('Large dataset detected - import may take some time');
    }

    return {
      dataType,
      columnMappings: mappings,
      confidence,
      suggestions,
      warnings,
      detectedColumns: headers,
    };
  }

  private getBasicFallbackAnalysis(csvData: Record<string, unknown>[]): AnalysisResult {
    const headers = Object.keys(csvData[0] || {});
    
    return {
      dataType: 'unknown',
      columnMappings: {},
      confidence: 0,
      suggestions: [
        'Analysis failed - please manually map columns',
        'Ensure your CSV file has proper headers',
        'Check that data is properly formatted',
      ],
      warnings: [
        'Automatic analysis was not possible',
        'Manual column mapping required',
      ],
      detectedColumns: headers,
    };
  }

  private isDateLike(value: string): boolean {
    if (!value) return false;
    
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // M/D/YY or MM/DD/YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
  }
} 