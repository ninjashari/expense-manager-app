'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Database, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisResult } from '@/lib/ai-csv-analyzer';

interface ImportData {
  importId?: string;
  totalRows?: number;
  analysis?: AnalysisResult;
}

interface ImportResults {
  importedRows: number;
  failedRows: number;
  errors: string[];
}

interface ImportConfirmationProps {
  importData: ImportData;
  columnMappings: Record<string, string>;
  onBack: () => void;
  onComplete: (results: ImportResults) => void;
}

export function ImportConfirmation({ importData, columnMappings, onBack, onComplete }: ImportConfirmationProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<ImportResults | null>(null);

  const dataType = importData.analysis?.dataType || 'unknown';
  const totalRows = importData.totalRows || 0;

  const executeImport = async () => {
    setIsExecuting(true);
    setProgress(0);
    
    try {
      setCurrentStep('Starting import...');
      setProgress(10);

      const response = await fetch('/api/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importId: importData.importId,
        }),
      });

      setProgress(50);
      setCurrentStep('Processing data...');

      const result = await response.json();
      
      if (result.success) {
        setProgress(100);
        setCurrentStep('Import completed!');
        setResults(result.results);
        
        toast.success(`Successfully imported ${result.results.importedRows} records`);
        
        setTimeout(() => {
          onComplete(result.results);
        }, 2000);
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import execution failed:', error);
      toast.error(error instanceof Error ? error.message : 'Import failed');
      setIsExecuting(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const getMappedFieldsCount = () => {
    return Object.keys(columnMappings).length;
  };

  const getRequiredFields = () => {
    const fieldMap = {
      transactions: ['date', 'amount', 'payee', 'account'],
      accounts: ['name', 'type', 'currency'],
      categories: ['name', 'type']
    };
    return fieldMap[dataType as keyof typeof fieldMap] || [];
  };

  const getEstimatedTime = () => {
    // Rough estimate: 100 rows per second
    const seconds = Math.ceil(totalRows / 100);
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.ceil(seconds / 60)} minutes`;
  };

  if (results) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Import Completed!</h3>
          <p className="text-muted-foreground">
            Your data has been successfully imported into your expense manager.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{results.importedRows}</p>
                <p className="text-sm text-muted-foreground">Records Imported</p>
              </div>
              {results.failedRows > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{results.failedRows}</p>
                  <p className="text-sm text-muted-foreground">Failed Records</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-3xl font-bold">{totalRows}</p>
                <p className="text-sm text-muted-foreground">Total Processed</p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Import Errors:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {results.errors.slice(0, 5).map((error: string, index: number) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                    {results.errors.length > 5 && (
                      <li className="text-sm font-medium">
                        ...and {results.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={() => onComplete(results)}>
            Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Ready to Import</h3>
        <p className="text-muted-foreground">
          Review the import summary and click &quot;Start Import&quot; to begin
        </p>
      </div>

      {/* Import Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalRows}</p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold capitalize">{dataType}</p>
              <p className="text-sm text-muted-foreground">Data Type</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{getMappedFieldsCount()}</p>
              <p className="text-sm text-muted-foreground">Mapped Fields</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{getEstimatedTime()}</p>
              <p className="text-sm text-muted-foreground">Est. Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Mappings Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Column Mappings
          </CardTitle>
          <CardDescription>
            How your CSV columns will be mapped to database fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Object.entries(columnMappings).map(([csvColumn, dbField]) => (
              <div key={csvColumn} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="font-medium">{csvColumn}</span>
                <div className="flex items-center gap-2">
                  <span>→</span>
                  <Badge variant={getRequiredFields().includes(dbField) ? "destructive" : "secondary"}>
                    {dbField}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isExecuting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Import Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Please do not close this window while the import is in progress.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExecuting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Preview
        </Button>
        
        <Button
          onClick={executeImport}
          disabled={isExecuting}
          size="lg"
        >
          {isExecuting ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Start Import
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 