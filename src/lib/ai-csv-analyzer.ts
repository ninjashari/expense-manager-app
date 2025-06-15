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
    
    console.log('🔍 Enhanced pattern analysis started:', {
      fileName,
      headers,
      sampleRow,
      totalRows: csvData.length
    });
    
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

    // Score each data type and create mappings
    let transactionScore = 0;
    let accountScore = 0;
    let categoryScore = 0;

    // Track mappings for each data type
    const transactionMappings: Record<string, string> = {};
    const accountMappings: Record<string, string> = {};
    const categoryMappings: Record<string, string> = {};

    console.log('🔍 Starting pattern matching for headers:', headers);

    headers.forEach(header => {
      const sampleValue = String(sampleRow[header] || '').toLowerCase();
      
      console.log(`📊 Analyzing header "${header}" with sample value "${sampleValue}"`);

      // Check transaction patterns
      for (const [field, pattern] of Object.entries(transactionPatterns)) {
        if (pattern.test(header)) {
          transactionMappings[header] = field;
          transactionScore++;
          console.log(`✅ Transaction match: "${header}" → "${field}" (score: ${transactionScore})`);
          
          // Additional validation based on sample data
          if (field === 'amount' && sampleValue && !isNaN(Number(sampleValue.replace(/[^0-9.-]/g, '')))) {
            transactionScore += 0.5;
            console.log(`💰 Amount validation passed, bonus score: ${transactionScore}`);
          }
          if (field === 'date' && this.isDateLike(sampleValue)) {
            transactionScore += 0.5;
            console.log(`📅 Date validation passed, bonus score: ${transactionScore}`);
          }
        }
      }

      // Check account patterns
      for (const [fieldName, pattern] of Object.entries(accountPatterns)) {
        if (pattern.test(header)) {
          accountMappings[header] = fieldName;
          accountScore++;
          console.log(`✅ Account match: "${header}" → "${fieldName}" (score: ${accountScore})`);
          if (fieldName === 'type' && /checking|savings|credit|cash|investment/i.test(sampleValue)) {
            accountScore += 0.5;
            console.log(`🏦 Account type validation passed, bonus score: ${accountScore}`);
          }
        }
      }

      // Check category patterns
      for (const [fieldName, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(header)) {
          categoryMappings[header] = fieldName;
          categoryScore++;
          console.log(`✅ Category match: "${header}" → "${fieldName}" (score: ${categoryScore})`);
        }
      }
    });

    console.log('📊 Pattern matching scores:', {
      transactionScore,
      accountScore,
      categoryScore,
      transactionMappings,
      accountMappings,
      categoryMappings
    });

    // Determine data type based on scores and assign appropriate mappings
    // Prioritize the highest score
    const scores = [
      { type: 'accounts', score: accountScore, mappings: accountMappings },
      { type: 'transactions', score: transactionScore, mappings: transactionMappings },
      { type: 'categories', score: categoryScore, mappings: categoryMappings }
    ];
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    const topScore = scores[0];
    
    console.log('🏆 Score ranking:', scores.map(s => `${s.type}: ${s.score}`));
    
    if (topScore.score >= 2) {
      dataType = topScore.type as AnalysisResult['dataType'];
      Object.assign(mappings, topScore.mappings);
      
      if (dataType === 'transactions') {
        suggestions.push('Detected transaction data - ensure date and amount formats are consistent');
        if (!mappings.date) warnings.push('No date column detected - this is required for transactions');
        if (!mappings.amount) warnings.push('No amount column detected - this is required for transactions');
        if (!mappings.payee) warnings.push('No payee/description column detected - this is required for transactions');
      } else if (dataType === 'accounts') {
        suggestions.push('Detected account data - verify account types and currency codes');
        if (!mappings.name) warnings.push('No name column detected - this is required for accounts');
        if (!mappings.type) warnings.push('No type column detected - this is required for accounts');
        if (!mappings.currency) warnings.push('No currency column detected - this is required for accounts');
      } else if (dataType === 'categories') {
        suggestions.push('Detected category data - ensure category types are specified');
        if (!mappings.name) warnings.push('No name column detected - this is required for categories');
        if (!mappings.type) warnings.push('No type column detected - this is required for categories');
      }
    } else {
      dataType = 'unknown';
      warnings.push('Could not determine data type automatically');
      suggestions.push('Please manually map columns to appropriate fields');
    }

    // File name hints - can override low-confidence detection
    const fileNameLower = fileName.toLowerCase();
    console.log('🔍 Checking filename hints:', { fileName, fileNameLower });
    
    // Check for categories first (most specific)
    if (fileNameLower.includes('categor') || fileNameLower.includes('category')) {
      if (dataType === 'unknown' || topScore.score <= 2) {
        dataType = 'categories';
        Object.assign(mappings, categoryMappings);
        suggestions.push('File name suggests category data');
        console.log('📝 Filename hint: overriding to categories');
      }
    } else if (fileNameLower.includes('account') || fileNameLower.includes('bank')) {
      if (dataType === 'unknown' || (dataType === 'transactions' && topScore.score < 4)) {
        dataType = 'accounts';
        Object.assign(mappings, accountMappings);
        suggestions.push('File name suggests account data');
        console.log('📝 Filename hint: overriding to accounts');
      }
    } else if (fileNameLower.includes('transaction') || fileNameLower.includes('expense') || fileNameLower.includes('income')) {
      if (dataType === 'unknown') {
        dataType = 'transactions';
        Object.assign(mappings, transactionMappings);
        suggestions.push('File name suggests transaction data');
        console.log('📝 Filename hint: detected as transactions');
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

    const result = {
      dataType,
      columnMappings: mappings,
      confidence,
      suggestions,
      warnings,
      detectedColumns: headers,
    };

    console.log('✅ Pattern analysis completed:', result);

    return result;
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