/**
 * @file category-import.tsx
 * @description This file contains the category import component for bulk importing categories from CSV files.
 * It handles file upload, CSV parsing, validation, and batch creation of categories.
 */

"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react"
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
 * Category import item interface
 * @description Structure for individual category import items
 */
interface CategoryImportItem {
  displayName: string
  status: 'pending' | 'success' | 'error' | 'duplicate'
  error?: string
}

/**
 * Props interface for CategoryImport component
 * @description Defines the props required for the category import component
 */
interface CategoryImportProps {
  /**
   * Callback function called when import is completed
   * @param result - Import result summary
   */
  onImportComplete: (result: ImportResult) => void
  /**
   * User ID for creating categories
   */
  userId: string
  /**
   * Loading state for import process
   */
  isLoading?: boolean
}

/**
 * CategoryImport component
 * @description Renders a CSV import interface for bulk category creation
 * @param props - Component props
 * @returns JSX element containing the import interface
 */
export function CategoryImport({ onImportComplete, userId, isLoading = false }: CategoryImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importItems, setImportItems] = useState<CategoryImportItem[]>([])
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
        toast.error('No valid categories found in the CSV file')
      } else {
        toast.success(`Found ${items.length} categories to import`)
      }
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Failed to parse CSV file')
      setFile(null)
    }
  }

  /**
   * Parse CSV content
   * @description Parses CSV text and extracts category display names
   * @param csvText - Raw CSV text content
   * @returns Array of category import items
   */
  const parseCSV = (csvText: string): CategoryImportItem[] => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const items: CategoryImportItem[] = []
    
    // Skip header row if it exists (check if first row contains "category", "name", "display" etc.)
    const startIndex = lines[0] && /^(category|name|display)/i.test(lines[0]) ? 1 : 0
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      
      // Handle CSV with or without quotes
      const displayName = line.replace(/^["']|["']$/g, '').trim()
      
      if (displayName.length >= 2 && displayName.length <= 50) {
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
   * @description Processes the import items and creates categories in batches
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

    // Import categories using the service
    try {
      const { importCategoriesFromList } = await import('@/lib/services/supabase-category-service')
      
      const displayNames = importItems
        .filter(item => item.status === 'pending')
        .map(item => item.displayName)

      const importResults = await importCategoriesFromList(displayNames, userId, (progress) => {
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
            result.failed++
            result.errors.push(`${item.displayName}: ${importResult.error}`)
            return { ...item, status: 'error' as const, error: importResult.error }
          }
        }

        result.failed++
        result.errors.push(`${item.displayName}: Unknown error`)
        return { ...item, status: 'error' as const, error: 'Unknown error' }
      })

      setImportItems(updatedItems)
      setImportResult(result)
      onImportComplete(result)

      // Show summary toast
      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} categories`)
      }
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} categories`)
      }

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Download sample CSV
   * @description Creates and downloads a sample CSV file for reference
   */
  const downloadSampleCSV = () => {
    const sampleData = [
      'Category Name',
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Entertainment',
      'Bills & Utilities',
      'Healthcare',
      'Travel',
      'Education',
      'Groceries',
      'Gas & Fuel'
    ]
    
    const csvContent = sampleData.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-categories.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Get status icon for import item
   * @description Returns appropriate icon based on item status
   * @param status - Import item status
   * @returns JSX icon element
   */
  const getStatusIcon = (status: CategoryImportItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Categories from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file containing category names to bulk import categories. 
          The CSV should contain one category name per line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting || isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose CSV File
            </Button>
            
            <Button
              variant="ghost"
              onClick={downloadSampleCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>

            {file && (
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={isImporting}
              >
                Clear
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Selected file: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Import Preview */}
        {importItems.length > 0 && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Import Preview</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {importItems.filter(item => item.status === 'pending').length} to import
                </Badge>
                {importItems.some(item => item.status === 'duplicate') && (
                  <Badge variant="outline">
                    {importItems.filter(item => item.status === 'duplicate').length} duplicates
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing categories...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            {/* Import Items List */}
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <div className="space-y-1 p-2">
                {importItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">{item.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'duplicate' && (
                        <Badge variant="outline" className="text-xs">
                          Duplicate in file
                        </Badge>
                      )}
                      {item.error && (
                        <span className="text-xs text-red-600">{item.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Actions */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleImport}
                disabled={isImporting || isLoading || importItems.filter(item => item.status === 'pending').length === 0}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Categories
              </Button>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Import Results</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{importResult.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Import Errors:</h4>
                  <div className="max-h-32 overflow-y-auto bg-red-50 rounded-md p-3">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 