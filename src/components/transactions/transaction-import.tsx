/**
 * @file transaction-import.tsx
 * @description This file contains the transaction import component for uploading and processing CSV files.
 * It handles file validation, parsing, data matching, and bulk transaction creation.
 */

"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
      throw new Error('CSV file must have at least a header and one data row')
    }

    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ''))

    const transactions: ParsedTransaction[] = []

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
        id: row.ID || `temp-${i}`,
        date: parsedDate || new Date(),
        account: row.Account || '',
        payee: isTransfer ? '' : (row.Payee || ''),
        category: row.Category || '',
        amount: amount,
        notes: row.Notes || '',
        type: type,
        withdrawal: finalWithdrawal,
        deposit: finalDeposit,
        validationErrors: validationErrors,
        isTransfer: isTransfer,
        transferToAccount: transferToAccount
      }

      transactions.push(transaction)
    }

    return transactions
  }, [parseDate, parseCSVLine])

  /**
   * Handle file upload
   * @description Processes uploaded CSV file and parses transactions
   * @param file - Uploaded file
   */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setIsProcessing(true)
    setProgress(10)

    try {
      const text = await file.text()
      setProgress(50)

      const transactions = parseCSVContent(text)
      setProgress(90)

      setParsedTransactions(transactions)
      setProgress(100)

      toast.success(`Parsed ${transactions.length} transactions from CSV`)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Error parsing CSV: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }, [parseCSVContent])

  /**
   * Handle drag and drop
   * @description Handles file drop events
   * @param event - Drop event
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
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
        resetState()
      }

      if (summary.failed > 0) {
        toast.warning(`${summary.failed} transactions failed to import`)
      }
      
    } catch (error) {
      console.error('Error during import:', error)
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessing(false)
    }
  }, [parsedTransactions, accounts, categories, payees, userId, importOptions, onImportComplete, resetState])

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
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
          {parsedTransactions.length > 0 && (
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
                    disabled={isProcessing || parsedTransactions.length === 0}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Import Transactions
                  </Button>
                </div>
              </div>

              {/* Import Options */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Import Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createCategories"
                      checked={importOptions.createMissingCategories}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, createMissingCategories: !!checked }))
                      }
                    />
                    <Label htmlFor="createCategories" className="text-sm">
                      Create missing categories
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createPayees"
                      checked={importOptions.createMissingPayees}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, createMissingPayees: !!checked }))
                      }
                    />
                    <Label htmlFor="createPayees" className="text-sm">
                      Create missing payees
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={importOptions.skipDuplicates}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, skipDuplicates: !!checked }))
                      }
                    />
                    <Label htmlFor="skipDuplicates" className="text-sm">
                      Skip duplicate transactions
                    </Label>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {parsedTransactions.some(t => t.validationErrors.length > 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Some transactions have validation errors. They will be skipped during import.
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview Table */}
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
                                Error
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Ready
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}