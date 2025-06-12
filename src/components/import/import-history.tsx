'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Eye, 
  RefreshCw,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ImportHistoryProps {
  onNewImport: () => void;
}

interface ImportRecord {
  _id: string;
  fileName: string;
  status: 'pending' | 'analyzing' | 'ready' | 'importing' | 'completed' | 'failed';
  totalRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: string;
  completedAt?: string;
  aiAnalysis?: {
    dataType: string;
    confidence: number;
  };
  importErrors?: string[];
}

interface ImportDetailsData {
  _id: string;
  fileName: string;
  fileSize: number;
  status: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: string;
  completedAt?: string;
  aiAnalysis: {
    dataType: string;
    confidence: number;
    columnMappings: Record<string, string>;
    suggestions: string[];
    warnings: string[];
  };
  userConfirmedMappings?: Record<string, string>;
  importErrors: string[];
  previewData: Record<string, unknown>[];
}

const STATUS_CONFIG = {
  pending: { color: 'bg-gray-500', label: 'Pending', icon: Clock },
  analyzing: { color: 'bg-blue-500', label: 'Analyzing', icon: RefreshCw },
  ready: { color: 'bg-yellow-500', label: 'Ready', icon: AlertCircle },
  importing: { color: 'bg-blue-500', label: 'Importing', icon: RefreshCw },
  completed: { color: 'bg-green-500', label: 'Completed', icon: CheckCircle },
  failed: { color: 'bg-red-500', label: 'Failed', icon: AlertCircle },
};

export function ImportHistory({ onNewImport }: ImportHistoryProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<ImportDetailsData | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const fetchImports = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/import/history?${params}`);
      const result = await response.json();

      if (result.success) {
        setImports(result.data.imports);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch import history:', error);
      toast.error('Failed to load import history');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.currentPage]);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const fetchImportDetails = async (importId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch('/api/import/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ importId }),
      });

      const result = await response.json();
      if (result.success) {
        setDetailsData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch import details:', error);
      toast.error('Failed to load import details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const deleteImport = async (importId: string) => {
    try {
      const response = await fetch('/api/import/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ importId }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Import record deleted successfully');
        fetchImports();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete import:', error);
      toast.error('Failed to delete import record');
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleViewDetails = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    fetchImportDetails(importRecord._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading import history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Import History</h3>
          <p className="text-sm text-muted-foreground">
            View and manage your CSV import history
          </p>
        </div>
        <Button onClick={onNewImport}>
          <FileText className="w-4 h-4 mr-2" />
          New Import
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="importing">Importing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={() => fetchImports()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Import List */}
      {imports.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No import history</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You have not imported any CSV files yet.
            </p>
            <Button onClick={onNewImport}>
              Start Your First Import
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
            <CardDescription>
              Total: {pagination.totalCount} imports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((importRecord) => (
                  <TableRow key={importRecord._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{importRecord.fileName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {importRecord.aiAnalysis?.dataType || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(importRecord.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {importRecord.status === 'completed' ? (
                          <>
                            <span className="text-green-600 font-medium">
                              {importRecord.importedRows}
                            </span>
                            {importRecord.failedRows > 0 && (
                              <span className="text-red-600">
                                {' '}/{' '}{importRecord.failedRows} failed
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              {' '}of {importRecord.totalRows}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {importRecord.totalRows} total
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(importRecord.createdAt), { addSuffix: true })}
                        </div>
                        {importRecord.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed {formatDistanceToNow(new Date(importRecord.completedAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(importRecord)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Import Details</DialogTitle>
                              <DialogDescription>
                                Details for {selectedImport?.fileName}
                              </DialogDescription>
                            </DialogHeader>
                            {detailsLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                                Loading details...
                              </div>
                            ) : detailsData ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">File Size:</label>
                                    <p className="text-sm text-muted-foreground">
                                      {(detailsData.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Data Type:</label>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {detailsData.aiAnalysis?.dataType}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">AI Confidence:</label>
                                    <p className="text-sm text-muted-foreground">
                                      {((detailsData.aiAnalysis?.confidence || 0) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status:</label>
                                    <div className="mt-1">
                                      {getStatusBadge(detailsData.status)}
                                    </div>
                                  </div>
                                </div>

                                {detailsData.importErrors && detailsData.importErrors.length > 0 && (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      <strong>Import Errors:</strong>
                                      <ul className="mt-2 list-disc list-inside">
                                        {detailsData.importErrors.slice(0, 3).map((error: string, index: number) => (
                                          <li key={index} className="text-sm">{error}</li>
                                        ))}
                                        {detailsData.importErrors.length > 3 && (
                                          <li className="text-sm font-medium">
                                            ...and {detailsData.importErrors.length - 3} more errors
                                          </li>
                                        )}
                                      </ul>
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {detailsData.previewData && detailsData.previewData.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Sample Data:</label>
                                    <div className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                                      <pre>{JSON.stringify(detailsData.previewData[0], null, 2)}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No details available
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteImport(importRecord._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 