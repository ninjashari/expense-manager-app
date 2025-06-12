export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorCount: number;
  warningCount: number;
}

export class ImportValidator {
  static validateTransactions(data: any[], mappings: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        errorCount: 0,
        warningCount: 0
      }
    };

    const requiredFields = ['date', 'amount', 'payee', 'account'];
    const optionalFields = ['category', 'notes', 'type'];

    data.forEach((row, index) => {
      const rowNum = index + 1;
      let rowValid = true;

      // Check required fields
      requiredFields.forEach(field => {
        const csvColumn = Object.keys(mappings).find(key => mappings[key] === field);
        if (!csvColumn || !row[csvColumn] || row[csvColumn].toString().trim() === '') {
          result.errors.push({
            row: rowNum,
            field: field,
            message: `Required field '${field}' is missing or empty`,
            value: csvColumn ? row[csvColumn] : null
          });
          rowValid = false;
        }
      });

      // Validate specific fields if they exist
      const amountColumn = Object.keys(mappings).find(key => mappings[key] === 'amount');
      if (amountColumn && row[amountColumn]) {
        const amount = parseFloat(row[amountColumn].toString());
        if (isNaN(amount)) {
          result.errors.push({
            row: rowNum,
            field: 'amount',
            message: 'Amount must be a valid number',
            value: row[amountColumn]
          });
          rowValid = false;
        } else if (amount === 0) {
          result.warnings.push({
            row: rowNum,
            field: 'amount',
            message: 'Amount is zero',
            value: amount
          });
        }
      }

      const dateColumn = Object.keys(mappings).find(key => mappings[key] === 'date');
      if (dateColumn && row[dateColumn]) {
        const date = new Date(row[dateColumn]);
        if (isNaN(date.getTime())) {
          result.errors.push({
            row: rowNum,
            field: 'date',
            message: 'Date is not in a valid format',
            value: row[dateColumn]
          });
          rowValid = false;
        } else {
          // Check if date is in the future
          if (date > new Date()) {
            result.warnings.push({
              row: rowNum,
              field: 'date',
              message: 'Date is in the future',
              value: row[dateColumn]
            });
          }
          // Check if date is too old (more than 10 years ago)
          const tenYearsAgo = new Date();
          tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
          if (date < tenYearsAgo) {
            result.warnings.push({
              row: rowNum,
              field: 'date',
              message: 'Date is more than 10 years old',
              value: row[dateColumn]
            });
          }
        }
      }

      // Validate payee
      const payeeColumn = Object.keys(mappings).find(key => mappings[key] === 'payee');
      if (payeeColumn && row[payeeColumn]) {
        const payee = row[payeeColumn].toString().trim();
        if (payee.length < 2) {
          result.warnings.push({
            row: rowNum,
            field: 'payee',
            message: 'Payee name is very short',
            value: payee
          });
        }
        if (payee.length > 100) {
          result.warnings.push({
            row: rowNum,
            field: 'payee',
            message: 'Payee name is very long (>100 characters)',
            value: payee
          });
        }
      }

      // Update stats
      if (rowValid) {
        result.stats.validRows++;
      } else {
        result.stats.invalidRows++;
        result.isValid = false;
      }
    });

    result.stats.errorCount = result.errors.length;
    result.stats.warningCount = result.warnings.length;

    return result;
  }

  static validateAccounts(data: any[], mappings: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        errorCount: 0,
        warningCount: 0
      }
    };

    const requiredFields = ['name', 'type', 'currency'];
    const validAccountTypes = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'];
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY'];

    data.forEach((row, index) => {
      const rowNum = index + 1;
      let rowValid = true;

      // Check required fields
      requiredFields.forEach(field => {
        const csvColumn = Object.keys(mappings).find(key => mappings[key] === field);
        if (!csvColumn || !row[csvColumn] || row[csvColumn].toString().trim() === '') {
          result.errors.push({
            row: rowNum,
            field: field,
            message: `Required field '${field}' is missing or empty`,
            value: csvColumn ? row[csvColumn] : null
          });
          rowValid = false;
        }
      });

      // Validate account type
      const typeColumn = Object.keys(mappings).find(key => mappings[key] === 'type');
      if (typeColumn && row[typeColumn]) {
        const accountType = row[typeColumn].toString().trim();
        if (!validAccountTypes.includes(accountType)) {
          result.warnings.push({
            row: rowNum,
            field: 'type',
            message: `Account type '${accountType}' is not standard. Valid types: ${validAccountTypes.join(', ')}`,
            value: accountType
          });
        }
      }

      // Validate currency
      const currencyColumn = Object.keys(mappings).find(key => mappings[key] === 'currency');
      if (currencyColumn && row[currencyColumn]) {
        const currency = row[currencyColumn].toString().trim().toUpperCase();
        if (!validCurrencies.includes(currency)) {
          result.warnings.push({
            row: rowNum,
            field: 'currency',
            message: `Currency '${currency}' is not commonly supported. Common currencies: ${validCurrencies.join(', ')}`,
            value: currency
          });
        }
      }

      // Validate balance if provided
      const balanceColumn = Object.keys(mappings).find(key => mappings[key] === 'balance');
      if (balanceColumn && row[balanceColumn]) {
        const balance = parseFloat(row[balanceColumn].toString());
        if (isNaN(balance)) {
          result.errors.push({
            row: rowNum,
            field: 'balance',
            message: 'Balance must be a valid number',
            value: row[balanceColumn]
          });
          rowValid = false;
        }
      }

      // Validate account name
      const nameColumn = Object.keys(mappings).find(key => mappings[key] === 'name');
      if (nameColumn && row[nameColumn]) {
        const name = row[nameColumn].toString().trim();
        if (name.length < 2) {
          result.errors.push({
            row: rowNum,
            field: 'name',
            message: 'Account name must be at least 2 characters long',
            value: name
          });
          rowValid = false;
        }
        if (name.length > 50) {
          result.warnings.push({
            row: rowNum,
            field: 'name',
            message: 'Account name is very long (>50 characters)',
            value: name
          });
        }
      }

      // Update stats
      if (rowValid) {
        result.stats.validRows++;
      } else {
        result.stats.invalidRows++;
        result.isValid = false;
      }
    });

    result.stats.errorCount = result.errors.length;
    result.stats.warningCount = result.warnings.length;

    return result;
  }

  static validateCategories(data: any[], mappings: Record<string, string>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        errorCount: 0,
        warningCount: 0
      }
    };

    const requiredFields = ['name', 'type'];
    const validTypes = ['Income', 'Expense'];

    data.forEach((row, index) => {
      const rowNum = index + 1;
      let rowValid = true;

      // Check required fields
      requiredFields.forEach(field => {
        const csvColumn = Object.keys(mappings).find(key => mappings[key] === field);
        if (!csvColumn || !row[csvColumn] || row[csvColumn].toString().trim() === '') {
          result.errors.push({
            row: rowNum,
            field: field,
            message: `Required field '${field}' is missing or empty`,
            value: csvColumn ? row[csvColumn] : null
          });
          rowValid = false;
        }
      });

      // Validate category type
      const typeColumn = Object.keys(mappings).find(key => mappings[key] === 'type');
      if (typeColumn && row[typeColumn]) {
        const categoryType = row[typeColumn].toString().trim();
        if (!validTypes.includes(categoryType)) {
          result.errors.push({
            row: rowNum,
            field: 'type',
            message: `Category type must be either 'Income' or 'Expense'`,
            value: categoryType
          });
          rowValid = false;
        }
      }

      // Validate category name
      const nameColumn = Object.keys(mappings).find(key => mappings[key] === 'name');
      if (nameColumn && row[nameColumn]) {
        const name = row[nameColumn].toString().trim();
        if (name.length < 2) {
          result.errors.push({
            row: rowNum,
            field: 'name',
            message: 'Category name must be at least 2 characters long',
            value: name
          });
          rowValid = false;
        }
        if (name.length > 30) {
          result.warnings.push({
            row: rowNum,
            field: 'name',
            message: 'Category name is very long (>30 characters)',
            value: name
          });
        }
      }

      // Update stats
      if (rowValid) {
        result.stats.validRows++;
      } else {
        result.stats.invalidRows++;
        result.isValid = false;
      }
    });

    result.stats.errorCount = result.errors.length;
    result.stats.warningCount = result.warnings.length;

    return result;
  }

  static validateData(data: any[], mappings: Record<string, string>, dataType: string): ValidationResult {
    switch (dataType) {
      case 'transactions':
        return this.validateTransactions(data, mappings);
      case 'accounts':
        return this.validateAccounts(data, mappings);
      case 'categories':
        return this.validateCategories(data, mappings);
      default:
        return {
          isValid: false,
          errors: [{ row: 0, field: 'dataType', message: `Unsupported data type: ${dataType}`, value: dataType }],
          warnings: [],
          stats: { totalRows: 0, validRows: 0, invalidRows: 0, errorCount: 1, warningCount: 0 }
        };
    }
  }
} 