'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, AlertCircle, ArrowDown, RefreshCw, Eye, BarChart3 } from 'lucide-react';
import { ImportValidator, ValidationResult } from '@/lib/import-validator';
import { toast } from 'sonner';
import { AnalysisResult } from '@/lib/ai-csv-analyzer';

interface ImportData {
  importId?: string;
  detectedColumns?: string[];
  previewData?: Record<string, unknown>[];
  analysis?: AnalysisResult;
}

interface CSVPreviewProps {
  importData: ImportData;
  onConfirm: (mappings: Record<string, string>) => void;
  isLoading: boolean;
}

const DATABASE_FIELDS = {
  transactions: {
    required: ['date', 'amount', 'payee', 'account'],
    optional: ['category', 'notes', 'type']
  },
  accounts: {
    required: ['name', 'type', 'currency'],
    optional: ['balance', 'creditLimit']
  },
  categories: {
    required: ['name', 'type'],
    optional: []
  }
};

export function CSVPreview({ importData, onConfirm, isLoading }: CSVPreviewProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const dataType = importData.analysis?.dataType || 'unknown';
  const csvColumns = importData.detectedColumns || [];
  
  const aiMappings = useMemo(() => 
    importData.analysis?.columnMappings || {}, 
    [importData.analysis?.columnMappings]
  );

  const generatePreview = useCallback(async (mappings: Record<string, string>) => {
    try {
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importId: importData.importId,
          columnMappings: mappings
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPreviewData(result.preview.mappedData || []);
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  }, [importData.importId]);

  const validateData = useCallback((mappings: Record<string, string>) => {
    if (!importData.previewData || dataType === 'unknown') return;
    
    const validationResult = ImportValidator.validateData(
      importData.previewData,
      mappings,
      dataType
    );
    setValidation(validationResult);
  }, [importData.previewData, dataType]);

  useEffect(() => {
    // Initialize with AI mappings
    setColumnMappings(aiMappings);
    generatePreview(aiMappings);
  }, [importData, aiMappings, generatePreview]);

  useEffect(() => {
    if (Object.keys(columnMappings).length > 0) {
      generatePreview(columnMappings);
      validateData(columnMappings);
    }
  }, [columnMappings, generatePreview, validateData]);

  const handleMappingChange = (csvColumn: string, dbField: string) => {
    const newMappings = { ...columnMappings };
    
    if (dbField === 'none') {
      delete newMappings[csvColumn];
    } else {
      // Remove any existing mapping to this database field
      Object.keys(newMappings).forEach(key => {
        if (newMappings[key] === dbField) {
          delete newMappings[key];
        }
      });
      newMappings[csvColumn] = dbField;
    }
    
    setColumnMappings(newMappings);
  };

  const handleConfirm = () => {
    if (!validation?.isValid) {
      toast.error('Please fix validation errors before proceeding');
      setShowValidation(true);
      return;
    }

    onConfirm(columnMappings);
  };

  const getRequiredFields = () => {
    return DATABASE_FIELDS[dataType as keyof typeof DATABASE_FIELDS]?.required || [];
  };

  const getOptionalFields = () => {
    return DATABASE_FIELDS[dataType as keyof typeof DATABASE_FIELDS]?.optional || [];
  };

  const getAllFields = () => {
    const required = getRequiredFields();
    const optional = getOptionalFields();
    return [...required, ...optional];
  };

  const getMissingRequiredFields = () => {
    const required = getRequiredFields();
    const mapped = Object.values(columnMappings);
    return required.filter(field => !mapped.includes(field));
  };

  if (dataType === 'unknown') {
    return (
      <div className="text-center space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to determine data type. Please ensure your CSV contains recognizable financial data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Map CSV Columns</h3>
          <p className="text-sm text-muted-foreground">
            Review and adjust how your CSV columns map to database fields
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {dataType} Data
        </Badge>
      </div>

      {/* Column Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Column Mappings</CardTitle>
          <CardDescription>
            Map your CSV columns to the appropriate database fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {csvColumns.map((column: string) => (
              <div key={column} className="flex items-center space-x-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{column}</p>
                  <p className="text-sm text-muted-foreground">
                    Sample: {String(importData.previewData?.[0]?.[column] || 'No data')}
                  </p>
                </div>
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <Select
                    value={columnMappings[column] || 'none'}
                    onValueChange={(value) => handleMappingChange(column, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Do not map</SelectItem>
                      {getRequiredFields().map(field => (
                        <SelectItem key={field} value={field}>
                          <span className="font-medium">{field}</span>
                          <Badge variant="destructive" className="ml-2 h-4 text-xs">Required</Badge>
                        </SelectItem>
                      ))}
                      {getOptionalFields().map(field => (
                        <SelectItem key={field} value={field}>
                          <span>{field}</span>
                          <Badge variant="secondary" className="ml-2 h-4 text-xs">Optional</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Missing Required Fields Alert */}
          {getMissingRequiredFields().length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing required fields:</strong> {getMissingRequiredFields().join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowValidation(!showValidation)}
          size="sm"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {showValidation ? 'Hide' : 'Show'} Validation
          {validation && (
            <Badge 
              variant={validation.isValid ? "default" : "destructive"} 
              className="ml-2 h-4 text-xs"
            >
              {validation.stats.errorCount > 0 ? validation.stats.errorCount : '✓'}
            </Badge>
          )}
        </Button>
      </div>

      {/* Data Preview Section */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Preview of how your data will be imported (first 5 rows)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getAllFields().map(field => (
                        <TableHead key={field}>
                          {field}
                          {getRequiredFields().includes(field) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {getAllFields().map(field => (
                          <TableCell key={field}>
                            {row[field] ? String(row[field]) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Section */}
      {showValidation && (
        <Card>
          <CardHeader>
            <CardTitle>Data Validation</CardTitle>
            <CardDescription>
              Validation results for your mapped data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validation ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{validation.stats.totalRows}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{validation.stats.validRows}</p>
                    <p className="text-sm text-muted-foreground">Valid Rows</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{validation.stats.errorCount}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{validation.stats.warningCount}</p>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                </div>

                {/* Errors */}
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Errors found:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {validation.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-sm">
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                        {validation.errors.length > 10 && (
                          <li className="text-sm font-medium">
                            ...and {validation.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success */}
                {validation.isValid && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      All data validation checks passed! Your data is ready to import.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No validation data available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => generatePreview(columnMappings)}
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Preview
        </Button>
        
        <Button
          onClick={handleConfirm}
          disabled={isLoading || getMissingRequiredFields().length > 0}
        >
          {isLoading ? 'Processing...' : 'Continue to Import'}
        </Button>
      </div>
    </div>
  );
} 