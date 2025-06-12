'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileUpload } from '@/components/import/file-upload';
import { AIAnalysis } from '@/components/import/ai-analysis';
import { CSVPreview } from '@/components/import/csv-preview';
import { ImportConfirmation } from '@/components/import/import-confirmation';
import { ImportHistory } from '@/components/import/import-history';
import { CheckCircle, Upload, Brain, Eye, Database, History } from 'lucide-react';

type ImportStep = 'upload' | 'analyze' | 'preview' | 'confirm' | 'history';

interface ImportData {
  file?: File;
  importId?: string;
  analysis?: any;
  detectedColumns?: string[];
  previewData?: any[];
  totalRows?: number;
}

const STEPS = [
  { id: 'upload', title: 'Upload CSV', icon: Upload, description: 'Select and upload your CSV file' },
  { id: 'analyze', title: 'AI Analysis', icon: Brain, description: 'AI analyzes your data structure' },
  { id: 'preview', title: 'Preview & Map', icon: Eye, description: 'Review column mappings and data' },
  { id: 'confirm', title: 'Import Data', icon: Database, description: 'Execute the import process' },
];

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [importData, setImportData] = useState<ImportData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  const getCurrentStepIndex = () => {
    if (currentStep === 'history') return -1;
    return STEPS.findIndex(step => step.id === currentStep);
  };

  const getStepProgress = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex === -1) return 0;
    return ((currentIndex + 1) / STEPS.length) * 100;
  };

  const handleFileUploaded = (data: any) => {
    setImportData(prev => ({
      ...prev,
      file: data.file,
      importId: data.importId,
      detectedColumns: data.detectedColumns,
      previewData: data.previewData,
      totalRows: data.totalRows
    }));
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (analysis: any) => {
    setImportData(prev => ({
      ...prev,
      analysis
    }));
    setCurrentStep('preview');
  };

  const handlePreviewConfirm = (mappings: Record<string, string>) => {
    setColumnMappings(mappings);
    setCurrentStep('confirm');
  };

  const handleImportComplete = (results: any) => {
    // Reset for next import
    setImportData({});
    setColumnMappings({});
    setCurrentStep('history');
  };

  const handleNewImport = () => {
    setImportData({});
    setColumnMappings({});
    setCurrentStep('upload');
  };

  const handleBackToPreview = () => {
    setCurrentStep('preview');
  };

  const renderStepIndicator = () => {
    if (currentStep === 'history') return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Import Process
          </CardTitle>
          <CardDescription>
            Follow these steps to import your CSV data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getStepProgress()} className="w-full" />
            
            <div className="grid grid-cols-4 gap-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < getCurrentStepIndex();
                
                return (
                  <div
                    key={step.id}
                    className={`text-center p-3 rounded-lg border ${
                      isActive 
                        ? 'border-primary bg-primary/5' 
                        : isCompleted 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <h4 className={`font-medium text-sm ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload
            onUploadSuccess={handleFileUploaded}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );

      case 'analyze':
        return (
          <AIAnalysis
            importId={importData.importId!}
            onAnalysisSuccess={handleAnalysisComplete}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );

      case 'preview':
        return (
          <CSVPreview
            importData={importData}
            onConfirm={handlePreviewConfirm}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );

      case 'confirm':
        return (
          <ImportConfirmation
            importData={importData}
            columnMappings={columnMappings}
            onBack={handleBackToPreview}
            onComplete={handleImportComplete}
          />
        );

      case 'history':
        return <ImportHistory onNewImport={handleNewImport} />;

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CSV Import</h1>
          <p className="text-muted-foreground">
            Import transactions, accounts, or categories from CSV files with AI-powered analysis
          </p>
        </div>
        
        {currentStep !== 'history' && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() => setCurrentStep('history')}
          >
            <History className="h-4 w-4 mr-1" />
            View History
          </Badge>
        )}
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  );
} 