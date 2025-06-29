/**
 * @file account-import.tsx
 * @description This file contains the account import component for uploading and processing CSV files.
 * It handles file validation, parsing, data matching, and bulk account creation.
 */

"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, AlertCircle, CheckCircle2, X, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { Account, AccountType, AccountStatus, Currency, ACCOUNT_TYPE_OPTIONS, ACCOUNT_STATUS_OPTIONS, CURRENCY_OPTIONS } from '@/types/account'

/**
 * CSV row interface representing the structure of the import file
 * @description Maps to the CSV file structure with all possible columns
 */
interface CSVRow {
  ID: string
  Name: string
  Type: string
  Status: string
  'Initial Balance': string
  'Current Balance': string
  Currency: string
  'Account Opening Date': string
  Notes: string
  'Credit Limit': string
  'Payment Due Date': string
  'Bill Generation Date': string
  'Current Bill Paid': string
  'Created At': string
  'Updated At': string
}

/**
 * Parsed account data structure
 * @description Represents a parsed account from CSV with validation
 */
interface ParsedAccount {
  originalRow: number
  name: string
  type: AccountType
  status: AccountStatus
  initialBalance: number
  currentBalance: number
  currency: Currency
  accountOpeningDate: Date
  notes?: string
  creditLimit?: number
  paymentDueDate?: number
  billGenerationDate?: number
  currentBillPaid?: boolean
  validationErrors: string[]
  isValid: boolean
}

/**
 * Import options interface
 * @description Configuration options for the import process
 */
interface ImportOptions {
  skipDuplicates: boolean
  updateExisting: boolean
}

/**
 * Account import component props
 * @description Props interface for the AccountImport component
 */
interface AccountImportProps {
  onImportComplete: (result: { successful: number; failed: number; duplicates: number }) => void
  existingAccounts: Account[]
}

/**
 * AccountImport component
 * @description Handles CSV file upload and bulk account import functionality
 * @param props - Component props
 * @returns JSX element containing the import interface
 */
export function AccountImport({
  onImportComplete,
  existingAccounts
}: AccountImportProps) {
  // State management
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedAccounts, setParsedAccounts] = useState<ParsedAccount[]>([])
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Reset component state
   * @description Clears all state and resets the component to initial state
   */
  const resetState = useCallback(() => {
    setParsedAccounts([])
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /**
   * Parse date from various formats
   * @description Converts date string to Date object, supporting multiple formats
   * @param dateString - Date string in various formats
   * @returns Parsed Date object or null if invalid
   */
  const parseDate = useCallback((dateString: string): Date | null => {
    if (!dateString) return null
    
    // Try DD-MM-YYYY format first
    let parts = dateString.split('-')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day)
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date
        }
      }
    }
    
    // Try YYYY-MM-DD format
    parts = dateString.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month, day)
        if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
          return date
        }
      }
    }
    
    // Try parsing as ISO string or other standard formats
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  }, [])

  /**
   * Parse CSV line with proper quote handling
   * @description Parses a CSV line handling quoted fields that may contain commas
   * @param line - CSV line to parse
   * @returns Array of field values
   */
  const parseCSVLine = useCallback((line: string): string[] => {
    const fields: string[] = []
    let currentField = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"'
          i += 2
        } else {
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim())
        currentField = ''
        i++
      } else {
        currentField += char
        i++
      }
    }
    
    fields.push(currentField.trim())
    return fields
  }, [])

  /**
   * Validate account type
   * @description Checks if the account type is valid
   * @param type - Account type string
   * @returns Valid AccountType or null
   */
  const validateAccountType = useCallback((type: string): AccountType | null => {
    const normalizedType = type.toLowerCase().replace(/\s+/g, '_')
    const validTypes = ACCOUNT_TYPE_OPTIONS.map(opt => opt.value)
    return validTypes.includes(normalizedType as AccountType) ? normalizedType as AccountType : null
  }, [])

  /**
   * Validate account status
   * @description Checks if the account status is valid
   * @param status - Account status string
   * @returns Valid AccountStatus or null
   */
  const validateAccountStatus = useCallback((status: string): AccountStatus | null => {
    const normalizedStatus = status.toLowerCase()
    const validStatuses = ACCOUNT_STATUS_OPTIONS.map(opt => opt.value)
    return validStatuses.includes(normalizedStatus as AccountStatus) ? normalizedStatus as AccountStatus : null
  }, [])

  /**
   * Validate currency
   * @description Checks if the currency is valid
   * @param currency - Currency string
   * @returns Valid Currency or null
   */
  const validateCurrency = useCallback((currency: string): Currency | null => {
    const normalizedCurrency = currency.toUpperCase()
    const validCurrencies = CURRENCY_OPTIONS.map(opt => opt.value)
    return validCurrencies.includes(normalizedCurrency as Currency) ? normalizedCurrency as Currency : null
  }, [])

  /**
   * Parse CSV content into accounts
   * @description Processes CSV content and converts it to ParsedAccount objects
   * @param csvContent - Raw CSV file content
   * @returns Array of parsed accounts
   */
  const parseCSVContent = useCallback((csvContent: string): ParsedAccount[] => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row')
    }

    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ''))

    const accounts: ParsedAccount[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''))
      const row: Partial<CSVRow> = {}
      
      headers.forEach((header, index) => {
        row[header as keyof CSVRow] = values[index] || ''
      })

      const validationErrors: string[] = []

      // Validate required fields
      if (!row.Name?.trim()) {
        validationErrors.push('Account name is required')
      }

      const accountType = validateAccountType(row.Type || '')
      if (!accountType) {
        validationErrors.push(`Invalid account type: ${row.Type}`)
      }

      const accountStatus = validateAccountStatus(row.Status || '')
      if (!accountStatus) {
        validationErrors.push(`Invalid account status: ${row.Status}`)
      }

      const currency = validateCurrency(row.Currency || 'INR')
      if (!currency) {
        validationErrors.push(`Invalid currency: ${row.Currency}`)
      }

      const initialBalance = parseFloat(row['Initial Balance'] || '0')
      if (isNaN(initialBalance)) {
        validationErrors.push('Invalid initial balance')
      }

      const currentBalance = parseFloat(row['Current Balance'] || row['Initial Balance'] || '0')
      if (isNaN(currentBalance)) {
        validationErrors.push('Invalid current balance')
      }

      const accountOpeningDate = parseDate(row['Account Opening Date'] || '')
      if (!accountOpeningDate) {
        validationErrors.push('Invalid account opening date')
      }

      // Parse optional credit card fields
      let creditLimit: number | undefined
      let paymentDueDate: number | undefined
      let billGenerationDate: number | undefined
      let currentBillPaid: boolean | undefined

      if (accountType === 'credit_card') {
        if (row['Credit Limit']) {
          creditLimit = parseFloat(row['Credit Limit'])
          if (isNaN(creditLimit)) {
            validationErrors.push('Invalid credit limit')
          }
        }

        if (row['Payment Due Date']) {
          paymentDueDate = parseInt(row['Payment Due Date'], 10)
          if (isNaN(paymentDueDate) || paymentDueDate < 1 || paymentDueDate > 31) {
            validationErrors.push('Payment due date must be between 1 and 31')
          }
        }

        if (row['Bill Generation Date']) {
          billGenerationDate = parseInt(row['Bill Generation Date'], 10)
          if (isNaN(billGenerationDate) || billGenerationDate < 1 || billGenerationDate > 31) {
            validationErrors.push('Bill generation date must be between 1 and 31')
          }
        }

        if (row['Current Bill Paid']) {
          const billPaidStr = row['Current Bill Paid'].toLowerCase()
          currentBillPaid = billPaidStr === 'true' || billPaidStr === 'yes' || billPaidStr === '1'
        }
      }

      const parsedAccount: ParsedAccount = {
        originalRow: i,
        name: row.Name?.trim() || '',
        type: accountType || 'other',
        status: accountStatus || 'active',
        initialBalance: initialBalance || 0,
        currentBalance: currentBalance || initialBalance || 0,
        currency: currency || 'INR',
        accountOpeningDate: accountOpeningDate || new Date(),
        notes: row.Notes?.trim() || undefined,
        creditLimit,
        paymentDueDate,
        billGenerationDate,
        currentBillPaid,
        validationErrors,
        isValid: validationErrors.length === 0
      }

      accounts.push(parsedAccount)
    }

    return accounts
  }, [parseDate, parseCSVLine, validateAccountType, validateAccountStatus, validateCurrency])

  /**
   * Handle file selection
   * @description Processes selected CSV file
   * @param file - Selected file
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setIsProcessing(true)
    setProgress(10)

    try {
      const content = await file.text()
      setProgress(50)

      const parsed = parseCSVContent(content)
      setParsedAccounts(parsed)
      setProgress(100)

      const validCount = parsed.filter(a => a.isValid).length
      const invalidCount = parsed.length - validCount

      if (invalidCount > 0) {
        toast.warning(`Parsed ${parsed.length} accounts (${validCount} valid, ${invalidCount} with errors)`)
      } else {
        toast.success(`Successfully parsed ${validCount} accounts`)
      }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file')
      resetState()
    } finally {
      setIsProcessing(false)
    }
  }, [parseCSVContent, resetState])

  /**
   * Handle drag and drop events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  /**
   * Import accounts
   * @description Processes valid accounts and creates them
   */
  const handleImport = useCallback(async () => {
    const validAccounts = parsedAccounts.filter(account => account.isValid)
    
    if (validAccounts.length === 0) {
      toast.error('No valid accounts to import')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    let successful = 0
    let failed = 0
    let duplicates = 0

    try {
      for (let i = 0; i < validAccounts.length; i++) {
        const account = validAccounts[i]
        setProgress((i / validAccounts.length) * 100)

        try {
          // Check for duplicates
          const existingAccount = existingAccounts.find(
            existing => existing.name.toLowerCase() === account.name.toLowerCase()
          )

          if (existingAccount && importOptions.skipDuplicates) {
            duplicates++
            continue
          }

          // Prepare account data
          const accountData = {
            name: account.name,
            type: account.type,
            status: account.status,
            initialBalance: account.initialBalance,
            currency: account.currency,
            accountOpeningDate: account.accountOpeningDate,
            notes: account.notes,
            creditLimit: account.creditLimit,
            paymentDueDate: account.paymentDueDate,
            billGenerationDate: account.billGenerationDate,
            currentBillPaid: account.currentBillPaid
          }

          // Create account via API
          const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
          })

          if (response.ok) {
            successful++
          } else {
            failed++
            console.error(`Failed to create account ${account.name}:`, await response.text())
          }
        } catch (error) {
          failed++
          console.error(`Error creating account ${account.name}:`, error)
        }
      }

      setProgress(100)
      
      // Show results
      if (successful > 0) {
        toast.success(`Successfully imported ${successful} accounts`)
      }
      if (failed > 0) {
        toast.error(`Failed to import ${failed} accounts`)
      }
      if (duplicates > 0) {
        toast.info(`Skipped ${duplicates} duplicate accounts`)
      }

      // Call completion callback
      onImportComplete({ successful, failed, duplicates })

      // Reset state
      resetState()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import process failed')
    } finally {
      setIsProcessing(false)
    }
  }, [parsedAccounts, importOptions, existingAccounts, onImportComplete, resetState])

  /**
   * Download sample CSV template
   * @description Creates and downloads a sample CSV file
   */
  const downloadSampleCSV = useCallback(() => {
    const headers = [
      'ID', 'Name', 'Type', 'Status', 'Initial Balance', 'Current Balance', 
      'Currency', 'Account Opening Date', 'Notes', 'Credit Limit', 
      'Payment Due Date', 'Bill Generation Date', 'Current Bill Paid', 
      'Created At', 'Updated At'
    ]

    const sampleData = [
      [
        '1', 'HDFC Bank', 'savings', 'active', '100000', '136200', 'INR', 
        '2023-01-15', 'Primary salary account with HDFC Bank', '', '', '', 'true', 
        '2023-01-15 10:00:00', '2025-06-24 12:00:00'
      ],
      [
        '2', 'AXIS Bank', 'checking', 'active', '50000', '46200', 'INR', 
        '2023-03-20', 'Secondary checking account for daily expenses', '', '', '', 'true', 
        '2023-03-20 14:30:00', '2025-06-24 12:00:00'
      ],
      [
        '3', 'ICICI Bank', 'savings', 'active', '75000', '88500', 'INR', 
        '2022-08-10', 'Savings account for investment and long-term goals', '', '', '', 'true', 
        '2022-08-10 09:15:00', '2025-06-24 12:00:00'
      ]
    ]

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample_accounts.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Sample CSV downloaded')
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Import Accounts from CSV</h3>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to import multiple accounts at once
          </p>
        </div>
        <Button variant="outline" onClick={downloadSampleCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download Sample
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Drop your CSV file here, or{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </Button>
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV files with account information
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Import Options */}
      {parsedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipDuplicates"
                checked={importOptions.skipDuplicates}
                onCheckedChange={(checked) =>
                  setImportOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                }
              />
              <Label htmlFor="skipDuplicates">Skip duplicate accounts (by name)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateExisting"
                checked={importOptions.updateExisting}
                onCheckedChange={(checked) =>
                  setImportOptions(prev => ({ ...prev, updateExisting: checked as boolean }))
                }
              />
              <Label htmlFor="updateExisting">Update existing accounts</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {parsedAccounts.length > 0 && !isProcessing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {parsedAccounts.filter(a => a.isValid).length} valid accounts ready to import
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={parsedAccounts.filter(a => a.isValid).length === 0}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Import {parsedAccounts.filter(a => a.isValid).length} Accounts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedAccounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>{account.originalRow}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell>{account.status}</TableCell>
                      <TableCell>{account.currentBalance.toLocaleString()}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        {account.isValid ? (
                          <Badge variant="default">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {account.validationErrors.length} errors
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Validation Errors */}
            {parsedAccounts.some(a => !a.isValid) && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-destructive">Validation Errors:</h4>
                {parsedAccounts
                  .filter(a => !a.isValid)
                  .map((account, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Row {account.originalRow} ({account.name}):</strong>{' '}
                        {account.validationErrors.join(', ')}
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 