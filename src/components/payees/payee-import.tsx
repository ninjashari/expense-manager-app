/**
 * @file payee-import.tsx
 * @description This file contains the payee import component for bulk importing payees from CSV files.
 * It handles file upload, CSV parsing, validation, and batch creation of payees.
 */

"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

/**
 * CSV import result interface
 * @description Structure for tracking import results
 */
interface ImportResult {
  total: number
  successful: number
  failed: number
  duplicates: number
  errors: string[]
}

/**
 * Payee import item interface
 * @description Structure for individual payee import items
 */
interface PayeeImportItem {
  displayName: string
  status: 'pending' | 'success' | 'error' | 'duplicate'
  error?: string
}

/**
 * Props interface for PayeeImport component
 * @description Defines the props required for the payee import component
 */
interface PayeeImportProps {
  /**
   * Callback function called when import is completed
   * @param result - Import result summary
   */
  onImportComplete: (result: ImportResult) => void
  /**
   * User ID for creating payees
   */
  userId: string
  /**
   * Loading state for import process
   */
  isLoading?: boolean
}

/**
 * PayeeImport component
 * @description Renders a CSV import interface for bulk payee creation
 * @param props - Component props
 * @returns JSX element containing the import interface
 */
export function PayeeImport({ onImportComplete, userId, isLoading = false }: PayeeImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importItems, setImportItems] = useState<PayeeImportItem[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file selection
   * @description Processes the selected CSV file and parses its contents
   * @param event - File input change event
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setImportResult(null)
    
    try {
      const text = await selectedFile.text()
      const items = parseCSV(text)
      setImportItems(items)
      
      if (items.length === 0) {
        toast.error('No valid payees found in the CSV file')
      } else {
        toast.success(`Found ${items.length} payees to import`)
      }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Failed to parse CSV file')
      setFile(null)
    }
  }

  /**
   * Parse CSV content
   * @description Parses CSV text and extracts payee display names
   * @param csvText - Raw CSV text content
   * @returns Array of payee import items
   */
  const parseCSV = (csvText: string): PayeeImportItem[] => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const items: PayeeImportItem[] = []
    
    // Skip header row if it exists (check if first row contains "payee", "name", "display" etc.)
    const startIndex = lines[0] && /^(payee|name|display)/i.test(lines[0]) ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      
      // Handle CSV with or without quotes
      const displayName = line.replace(/^["']|["']$/g, '').trim()
      
      if (displayName.length >= 2 && displayName.length <= 100) {
        // Check for duplicates within the file
        const isDuplicate = items.some(item => 
          item.displayName.toLowerCase() === displayName.toLowerCase()
        )
        
        items.push({
          displayName,
          status: isDuplicate ? 'duplicate' : 'pending'
        })
      }
    }
    
    return items
  }

  /**
   * Handle import process
   * @description Processes the import items and creates payees in batches
   */
  const handleImport = async () => {
    if (!userId || importItems.length === 0) return

    setIsImporting(true)
    setImportProgress(0)

    const result: ImportResult = {
      total: importItems.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    }

    // Import payees using the service
    try {
      const { importPayeesFromList } = await import('@/lib/services/supabase-payee-service')
      
      const displayNames = importItems
        .filter(item => item.status === 'pending')
        .map(item => item.displayName)

      const importResults = await importPayeesFromList(displayNames, userId, (progress) => {
        setImportProgress(progress)
      })

      // Update import items with results
      const updatedItems = importItems.map(item => {
        if (item.status === 'duplicate') {
          result.duplicates++
          return item
        }

        const importResult = importResults.find(r => r.displayName === item.displayName)
        if (importResult) {
          if (importResult.success) {
            result.successful++
            return { ...item, status: 'success' as const }
          } else {
            if (importResult.isDuplicate) {
              result.duplicates++
              return { ...item, status: 'duplicate' as const }
            } else {
              result.failed++
              result.errors.push(`${item.displayName}: ${importResult.error}`)
              return { ...item, status: 'error' as const, error: importResult.error }
            }
          }
        }

        result.failed++
        result.errors.push(`${item.displayName}: Unknown error`)
        return { ...item, status: 'error' as const, error: 'Unknown error' }
      })

      setImportItems(updatedItems)
      setImportResult(result)
      onImportComplete(result)

      // Show completion toast
      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} payees`)
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} payees`)
      }
      if (result.duplicates > 0) {
        toast.warning(`Skipped ${result.duplicates} duplicate payees`)
      }

    } catch (error) {
      console.error('Error during import:', error)
      toast.error('Import failed due to an unexpected error')
      result.failed = importItems.length
      result.errors.push('Unexpected error during import')
      setImportResult(result)
    } finally {
      setIsImporting(false)
      setImportProgress(100)
    }
  }

  /**
   * Reset import state
   * @description Clears all import data and resets the component
   */
  const handleReset = () => {
    setFile(null)
    setImportItems([])
    setImportProgress(0)
    setIsImporting(false)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Download sample CSV file
   * @description Creates and downloads a sample CSV file for payee import
   */
  const downloadSampleCSV = () => {
    const sampleData = [
      'Payee Display Name',
      'Amazon',
      'Walmart',
      'Starbucks',
      'Shell Gas Station',
      'Netflix',
      'Electric Company',
      'Water Department',
      'Internet Service Provider',
      'Dr. Smith Medical',
      'ABC Restaurant'
    ]
    
    const csvContent = sampleData.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-payees.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Sample CSV downloaded')
  }

  /**
   * Get status icon for import item
   * @description Returns appropriate icon for import item status
   * @param status - Import item status
   * @returns React icon component
   */
  const getStatusIcon = (status: PayeeImportItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  /**
   * Get status badge variant
   * @description Returns appropriate badge variant for status
   * @param status - Import item status
   * @returns Badge variant
   */
  const getStatusBadge = (status: PayeeImportItem['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'duplicate':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Duplicate</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Import Payees from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing payee display names to bulk import them into your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isImporting || isLoading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || isLoading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? 'Change File' : 'Select CSV File'}
              </Button>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
            <Button
              onClick={downloadSampleCSV}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample
            </Button>
          </div>

          {/* CSV Format Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format:</strong> Your CSV should contain one payee display name per line. 
              The first row can be a header (optional). Names should be 2-100 characters long.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {importItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview ({importItems.length} payees)</CardTitle>
            <CardDescription>
              Review the payees that will be imported. Duplicates and invalid entries are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing payees...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Import Results Summary */}
            {importResult && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResult.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            )}

            {/* Import Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {importItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium">{item.displayName}</div>
                      {item.error && (
                        <div className="text-sm text-red-600">{item.error}</div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isImporting}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || importItems.filter(item => item.status === 'pending').length === 0}
                className="w-full sm:w-auto"
              >
                {isImporting ? 'Importing...' : `Import ${importItems.filter(item => item.status === 'pending').length} Payees`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 