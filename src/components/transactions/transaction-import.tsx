/**
 * @file transaction-import.tsx
 * @description This file contains the transaction import component for uploading and processing CSV files.
 * It handles file validation, parsing, data matching, and bulk transaction creation.
 */

"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, X, Download, FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Account } from '@/types/account'
import { Category } from '@/types/category'
import { Payee } from '@/types/payee'
import { 
  importTransactionsBatch, 
  generateImportSummary,
  CSVTransactionData,
  TransactionImportResult,
  ImportOptions
} from '@/lib/services/transaction-import-service'

/**
 * CSV row interface representing the structure of the import file
 * @description Maps to the CSV file structure with all possible columns
 */
interface CSVRow {
  ID: string
  Date: string
  Number: string
  Account: string
  Payee: string
  Status: string
  Category: string
  Tags: string
  Withdrawal: string
  Deposit: string
  Notes: string
  'Last Updated': string
  SN: string
}

// Use types from the import service
type ParsedTransaction = CSVTransactionData
type ImportResult = TransactionImportResult

/**
 * Import statistics interface
 * @description Provides summary statistics for the import process
 */
interface ImportStats {
  total: number
  successful: number
  failed: number
  duplicates: number
  transfers: number
  deposits: number
  withdrawals: number
}

/**
 * Transaction import component props
 * @description Props interface for the TransactionImport component
 */
interface TransactionImportProps {
  accounts: Account[]
  categories: Category[]
  payees: Payee[]
  onImportComplete: () => void
  userId: string
}

/**
 * TransactionImport component
 * @description Handles CSV file upload and bulk transaction import functionality
 * @param props - Component props
 * @returns JSX element containing the import interface
 */
export function TransactionImport({
  accounts,
  categories,
  payees,
  onImportComplete,
  userId
}: TransactionImportProps) {
  // State management
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([])
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [importStats, setImportStats] = useState<ImportStats | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    createMissingCategories: true,
    createMissingPayees: true,
    skipDuplicates: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Reset component state
   * @description Clears all state and resets the component to initial state
   */
  const resetState = useCallback(() => {
    setParsedTransactions([])
    setImportResults([])
    setImportStats(null)
    setShowResults(false)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /**
   * Parse date from DD-MM-YYYY format
   * @description Converts DD-MM-YYYY date string to Date object
   * @param dateString - Date string in DD-MM-YYYY format
   * @returns Parsed Date object or null if invalid
   */
  const parseDate = useCallback((dateString: string): Date | null => {
    if (!dateString) return null
    
    const parts = dateString.split('-')
    if (parts.length !== 3) return null
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
    const year = parseInt(parts[2], 10)
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    
    const date = new Date(year, month, day)
    
    // Validate the date
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return null
    }
    
    return date
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
          // Handle escaped quote
          currentField += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(currentField.trim())
        currentField = ''
        i++
      } else {
        currentField += char
        i++
      }
    }
    
    // Add the last field
    fields.push(currentField.trim())
    
    return fields
  }, [])

  /**
   * Parse CSV content into transactions
   * @description Processes CSV content and converts it to ParsedTransaction objects
   * @param csvContent - Raw CSV file content
   * @returns Array of parsed transactions
   */
  const parseCSVContent = useCallback((csvContent: string): ParsedTransaction[] => {
    const lines = csvContent.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row')
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''))
    const transactions: ParsedTransaction[] = []

    // Validate required headers
    const requiredHeaders = ['Date', 'Account', 'Payee', 'Category', 'Withdrawal', 'Deposit']
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''))
      const row: Partial<CSVRow> = {}
      
      headers.forEach((header, index) => {
        row[header as keyof CSVRow] = values[index] || ''
      })

      const validationErrors: string[] = []
      
      // Parse date
      const parsedDate = parseDate(row.Date || '')
      if (!parsedDate) {
        validationErrors.push('Invalid date format')
      }

      // Parse amounts
      const withdrawal = parseFloat(row.Withdrawal || '0') || 0
      const deposit = parseFloat(row.Deposit || '0') || 0
      
      // Skip amount validation for transfer transactions (they'll be validated later)
      const isTransferTransaction = (row.Payee || '').startsWith('>')
      
      if (!isTransferTransaction) {
        if (withdrawal === 0 && deposit === 0) {
          validationErrors.push('Transaction must have either withdrawal or deposit amount')
        }

        if (withdrawal > 0 && deposit > 0) {
          validationErrors.push('Transaction cannot have both withdrawal and deposit amounts')
        }
      }

      // Determine transaction type
      let type: 'deposit' | 'withdrawal' | 'transfer' = 'deposit'
      let amount = 0
      let isTransfer = false
      let transferToAccount: string | undefined
      let finalWithdrawal = withdrawal
      let finalDeposit = deposit

      if ((row.Payee || '').startsWith('>')) {
        // Transfer transaction
        type = 'transfer'
        isTransfer = true
        amount = withdrawal > 0 ? withdrawal : deposit
        transferToAccount = (row.Payee || '').substring(1).trim()
        // Clear withdrawal/deposit for transfers to avoid validation error
        finalWithdrawal = 0
        finalDeposit = 0
      } else if (withdrawal > 0) {
        type = 'withdrawal'
        amount = withdrawal
      } else {
        type = 'deposit'
        amount = deposit
      }

      const transaction: ParsedTransaction = {
        id: row.ID || `import-${i}`,
        date: parsedDate || new Date(),
        account: row.Account || '',
        payee: row.Payee || '',
        category: row.Category || '',
        withdrawal: finalWithdrawal,
        deposit: finalDeposit,
        notes: row.Notes || '',
        type,
        amount,
        isTransfer,
        transferToAccount,
        validationErrors
      }

      transactions.push(transaction)
    }

    return transactions
  }, [parseDate, parseCSVLine])

  /**
   * Handle file upload
   * @description Processes uploaded CSV file and parses transactions
   * @param file - Uploaded file object
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setIsProcessing(true)
    setProgress(10)

    try {
      const content = await file.text()
      setProgress(30)

      const parsed = parseCSVContent(content)
      setProgress(60)

      setParsedTransactions(parsed)
      setProgress(100)

      toast.success(`Successfully parsed ${parsed.length} transactions`)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [parseCSVContent])

  /**
   * Handle file drop
   * @description Handles drag-and-drop file upload
   * @param event - Drop event
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  /**
   * Handle file input change
   * @description Handles file selection through input element
   * @param event - Input change event
   */
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  /**
   * Import transactions to database
   * @description Processes parsed transactions and imports them to the database
   */
  const importTransactions = useCallback(async () => {
    if (parsedTransactions.length === 0) {
      toast.error('No transactions to import')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Import transactions using the new service
      const results = await importTransactionsBatch(
        parsedTransactions,
        accounts,
        categories,
        payees,
        userId,
        importOptions,
        (completed, total) => {
          setProgress((completed / total) * 100)
        }
      )

      // Generate summary statistics
      const summary = generateImportSummary(results)
      
      const newImportStats = {
        total: summary.total,
        successful: summary.successful,
        failed: summary.failed,
        duplicates: 0, // TODO: Implement duplicate detection
        transfers: summary.transfers,
        deposits: summary.deposits,
        withdrawals: summary.withdrawals
      }

      setImportResults(results)
      setImportStats(newImportStats)
      setShowResults(true)

      if (summary.successful > 0) {
        let message = `Successfully imported ${summary.successful} transactions`
        if (summary.createdCategories > 0) {
          message += ` (created ${summary.createdCategories} categories)`
        }
        if (summary.createdPayees > 0) {
          message += ` (created ${summary.createdPayees} payees)`
        }
        toast.success(message)
        onImportComplete()
      }

      if (summary.failed > 0) {
        toast.warning(`${summary.failed} transactions failed to import`)
      }
      
    } catch (error) {
      console.error('Error during import:', error)
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      
      const errorImportStats = {
        total: parsedTransactions.length,
        successful: 0,
        failed: parsedTransactions.length,
        duplicates: 0,
        transfers: 0,
        deposits: 0,
        withdrawals: 0
      }

      setImportResults([])
      setImportStats(errorImportStats)
      setShowResults(true)
      
    } finally {
      setIsProcessing(false)
    }
  }, [parsedTransactions, accounts, categories, payees, userId, importOptions, onImportComplete])

  /**
   * Download error report
   * @description Generates and downloads a CSV report of failed imports
   */
  const downloadErrorReport = useCallback(() => {
    const failedResults = importResults.filter(result => !result.success)
    if (failedResults.length === 0) {
      toast.info('No errors to report')
      return
    }

    const headers = ['Transaction ID', 'Date', 'Account', 'Payee', 'Category', 'Amount', 'Type', 'Error']
    const rows = failedResults.map(result => {
      const transaction = result.transaction
      return [
        transaction.id,
        transaction.date.toISOString().split('T')[0],
        transaction.account,
        transaction.payee,
        transaction.category,
        transaction.amount.toString(),
        transaction.type,
        result.error || 'Unknown error'
      ]
    })

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaction-import-errors-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Error report downloaded successfully')
  }, [importResults])

  /**
   * Download complete import report
   * @description Generates and downloads a comprehensive CSV report of all import results
   */
  const downloadCompleteReport = useCallback(() => {
    if (importResults.length === 0) {
      toast.info('No import results to report')
      return
    }

    const headers = [
      'Status', 'Transaction ID', 'Date', 'Account', 'Payee', 'Category', 
      'Amount', 'Type', 'Notes', 'Created Payee', 'Created Category', 'Error Details'
    ]
    
    const rows = importResults.map(result => {
      const transaction = result.transaction
      return [
        result.success ? 'SUCCESS' : 'FAILED',
        transaction.id,
        transaction.date.toISOString().split('T')[0],
        transaction.account,
        transaction.isTransfer ? transaction.transferToAccount : transaction.payee,
        transaction.category,
        transaction.amount.toString(),
        transaction.type,
        transaction.notes || '',
        result.createdPayee ? 'YES' : 'NO',
        result.createdCategory ? 'YES' : 'NO',
        result.error || ''
      ]
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaction-import-complete-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Complete import report downloaded successfully')
  }, [importResults])

  /**
   * Download successful transactions report
   * @description Generates and downloads a CSV report of successfully imported transactions
   */
  const downloadSuccessReport = useCallback(() => {
    const successfulResults = importResults.filter(result => result.success)
    if (successfulResults.length === 0) {
      toast.info('No successful transactions to report')
      return
    }

    const headers = [
      'Transaction ID', 'Date', 'Account', 'Payee', 'Category', 
      'Amount', 'Type', 'Notes', 'Created Payee', 'Created Category'
    ]
    
    const rows = successfulResults.map(result => {
      const transaction = result.transaction
      return [
        transaction.id,
        transaction.date.toISOString().split('T')[0],
        transaction.account,
        transaction.isTransfer ? transaction.transferToAccount : transaction.payee,
        transaction.category,
        transaction.amount.toString(),
        transaction.type,
        transaction.notes || '',
        result.createdPayee ? 'YES' : 'NO',
        result.createdCategory ? 'YES' : 'NO'
      ]
    })

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transaction-import-success-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Success report downloaded successfully')
  }, [importResults])



  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      {!showResults && (
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>
              Upload a CSV file to import transactions. The file should contain columns for Date (DD-MM-YYYY), Account, Payee, Category, Withdrawal, and Deposit amounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
            >
              <div className="flex flex-col items-center space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Parsed Transactions Preview */}
            {parsedTransactions.length > 0 && !showResults && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Preview ({parsedTransactions.length} transactions)
                  </h3>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={resetState}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={importTransactions} 
                      disabled={isProcessing}
                    >
                      Import Transactions
                    </Button>
                  </div>
                </div>

                {/* Import Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import Options</CardTitle>
                    <CardDescription>
                      Configure how missing categories and payees should be handled during import
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create-categories"
                        checked={importOptions.createMissingCategories}
                        onCheckedChange={(checked) =>
                          setImportOptions(prev => ({ ...prev, createMissingCategories: !!checked }))
                        }
                      />
                      <Label htmlFor="create-categories">
                        Create missing categories automatically
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create-payees"
                        checked={importOptions.createMissingPayees}
                        onCheckedChange={(checked) =>
                          setImportOptions(prev => ({ ...prev, createMissingPayees: !!checked }))
                        }
                      />
                      <Label htmlFor="create-payees">
                        Create missing payees automatically
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="w-full">
                  <div className="rounded-md border overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[140px]">Account</TableHead>
                            <TableHead className="w-[140px]">Payee</TableHead>
                            <TableHead className="w-[120px]">Category</TableHead>
                            <TableHead className="w-[120px] text-right">Amount</TableHead>
                            <TableHead className="w-[80px]">Type</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedTransactions.slice(0, 50).map((transaction, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                {transaction.date.toLocaleDateString()}
                              </TableCell>
                              <TableCell className="max-w-[140px]">
                                <div className="truncate text-sm" title={transaction.account}>
                                  {transaction.account}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[140px]">
                                <div className="truncate text-sm" title={transaction.isTransfer ? transaction.transferToAccount : transaction.payee}>
                                  {transaction.isTransfer ? transaction.transferToAccount : transaction.payee}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[120px]">
                                <div className="truncate text-sm" title={transaction.category}>
                                  {transaction.category}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                ₹{transaction.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    transaction.type === 'transfer' ? 'default' :
                                    transaction.type === 'deposit' ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {transaction.validationErrors.length > 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    Errors
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Valid
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedTransactions.length > 50 && (
                      <div className="px-3 py-2 bg-muted text-sm text-muted-foreground border-t">
                        Showing first 50 transactions. {parsedTransactions.length - 50} more will be imported.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {showResults && importStats && (
          <Card>
            <CardHeader>
              <CardTitle>Import Review Report</CardTitle>
              <CardDescription>
                Comprehensive review of the transaction import process with detailed results for future corrections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importStats.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importStats.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{importStats.transfers}</div>
                  <div className="text-sm text-muted-foreground">Transfers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{importStats.deposits + importStats.withdrawals}</div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
              </div>

            <Separator />

            {/* Download Actions */}
            <div className="flex flex-wrap gap-2">
              {importResults.length > 0 && (
                <Button variant="outline" onClick={downloadCompleteReport}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Complete Report
                </Button>
              )}
              {importStats.successful > 0 && (
                <Button variant="outline" onClick={downloadSuccessReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Success Report
                </Button>
              )}
              {importStats.failed > 0 && importResults.filter(r => !r.success).length > 0 && (
                <Button variant="outline" onClick={downloadErrorReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Error Report
                </Button>
              )}
              <Button onClick={resetState} className="ml-auto">
                Import More Transactions
              </Button>
            </div>

            {/* Detailed Review Tabs */}
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="successful">
                  Successful ({importStats.successful})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({importStats.failed})
                </TabsTrigger>
                <TabsTrigger value="entities">
                  New Entities
                </TabsTrigger>
              </TabsList>

              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Import Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Processed:</span>
                        <span className="font-medium">{importStats.successful + importStats.failed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-medium text-green-600">
                          {((importStats.successful / (importStats.successful + importStats.failed)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deposits:</span>
                        <span className="font-medium">{importStats.deposits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Withdrawals:</span>
                        <span className="font-medium">{importStats.withdrawals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfers:</span>
                        <span className="font-medium">{importStats.transfers}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Created Entities</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>New Categories:</span>
                        <span className="font-medium">
                          {importResults.filter(r => r.createdCategory).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Payees:</span>
                        <span className="font-medium">
                          {importResults.filter(r => r.createdPayee).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Import Date:</span>
                        <span className="font-medium text-sm">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Error Overview */}
                {importStats.failed > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {importResults.length === 0 ? (
                        <>The import process encountered a critical error and was unable to process any transactions. 
                        Please check your CSV file format and try again.</>
                      ) : (
                        <>{importStats.failed} transactions failed to import. Review the &quot;Failed&quot; tab for detailed error information
                        and download the error report for corrections.</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Successful Transactions Tab */}
              <TabsContent value="successful" className="space-y-4">
                {importStats.successful > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[140px]">Account</TableHead>
                            <TableHead className="w-[140px]">Payee</TableHead>
                            <TableHead className="w-[120px]">Category</TableHead>
                            <TableHead className="w-[120px] text-right">Amount</TableHead>
                            <TableHead className="w-[80px]">Type</TableHead>
                            <TableHead className="w-[100px]">New Entities</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResults.filter(result => result.success).slice(0, 50).map((result, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                {result.transaction.date.toLocaleDateString()}
                              </TableCell>
                              <TableCell className="max-w-[140px]">
                                <div className="truncate text-sm" title={result.transaction.account}>
                                  {result.transaction.account}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[140px]">
                                <div className="truncate text-sm" title={result.transaction.isTransfer ? result.transaction.transferToAccount : result.transaction.payee}>
                                  {result.transaction.isTransfer ? result.transaction.transferToAccount : result.transaction.payee}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[120px]">
                                <div className="truncate text-sm" title={result.transaction.category}>
                                  {result.transaction.category}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-medium">
                                ₹{result.transaction.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    result.transaction.type === 'transfer' ? 'default' :
                                    result.transaction.type === 'deposit' ? 'secondary' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {result.transaction.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {result.createdCategory && (
                                    <Badge variant="outline" className="text-xs">Cat</Badge>
                                  )}
                                  {result.createdPayee && (
                                    <Badge variant="outline" className="text-xs">Pay</Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {importResults.filter(result => result.success).length > 50 && (
                      <div className="px-3 py-2 bg-muted text-sm text-muted-foreground border-t">
                        Showing first 50 successful transactions. Download the success report for complete data.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No successful transactions to display
                  </div>
                )}
              </TabsContent>

              {/* Failed Transactions Tab */}
              <TabsContent value="failed" className="space-y-4">
                {importStats.failed > 0 ? (
                  <>
                    {importResults.filter(result => !result.success).length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Date</TableHead>
                                <TableHead className="w-[140px]">Account</TableHead>
                                <TableHead className="w-[140px]">Payee</TableHead>
                                <TableHead className="w-[120px]">Category</TableHead>
                                <TableHead className="w-[120px] text-right">Amount</TableHead>
                                <TableHead className="w-[80px]">Type</TableHead>
                                <TableHead className="min-w-[200px]">Error Details</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importResults.filter(result => !result.success).map((result, index) => (
                                <TableRow key={index}>
                                  <TableCell className="text-sm">
                                    {result.transaction.date.toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="max-w-[140px]">
                                    <div className="truncate text-sm" title={result.transaction.account}>
                                      {result.transaction.account}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[140px]">
                                    <div className="truncate text-sm" title={result.transaction.isTransfer ? result.transaction.transferToAccount : result.transaction.payee}>
                                      {result.transaction.isTransfer ? result.transaction.transferToAccount : result.transaction.payee}
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-[120px]">
                                    <div className="truncate text-sm" title={result.transaction.category}>
                                      {result.transaction.category}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-medium">
                                    ₹{result.transaction.amount.toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="destructive" className="text-xs">
                                      {result.transaction.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="min-w-[200px]">
                                    <div className="text-sm text-red-600" title={result.error}>
                                      {result.error}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="mx-auto h-12 w-12 mb-4 text-red-500" />
                        <p className="text-lg font-medium">Import process failed</p>
                        <p className="text-sm">The import encountered a critical error. Check the browser console for details.</p>
                        <p className="text-sm mt-2">Try uploading your CSV file again or check the file format.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mx-auto h-12 w-12 mb-4 text-green-500" />
                    <p className="text-lg font-medium">All transactions imported successfully!</p>
                    <p className="text-sm">No errors to report.</p>
                  </div>
                )}
              </TabsContent>

              {/* New Entities Tab */}
              <TabsContent value="entities" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Categories */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">New Categories Created</CardTitle>
                      <CardDescription>
                        Categories that were automatically created during import
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {importResults.filter(r => r.createdCategory).length > 0 ? (
                        <div className="space-y-2">
                          {[...new Set(importResults.filter(r => r.createdCategory).map(r => r.transaction.category))].map((category, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">NEW</Badge>
                              <span className="text-sm">{category}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No new categories were created</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* New Payees */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">New Payees Created</CardTitle>
                      <CardDescription>
                        Payees that were automatically created during import
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {importResults.filter(r => r.createdPayee).length > 0 ? (
                        <div className="space-y-2">
                          {[...new Set(importResults.filter(r => r.createdPayee).map(r => r.transaction.payee))].map((payee, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">NEW</Badge>
                              <span className="text-sm">{payee}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No new payees were created</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}