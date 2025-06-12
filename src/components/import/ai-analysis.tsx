'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnalysisResult } from '@/lib/ai-csv-analyzer';

interface AIAnalysisProps {
  importId: string;
  onAnalysisSuccess: (analysis: AnalysisResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export function AIAnalysis({ importId, onAnalysisSuccess, isLoading, setIsLoading }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 15;
        });
      }, 500);

      const response = await fetch('/api/import/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ importId }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Analysis failed');
      }

      setAnalysis(result.analysis);
      toast.success('AI analysis completed!');
      
      // Auto-proceed to next step after a brief delay
      setTimeout(() => {
        onAnalysisSuccess(result.analysis);
      }, 1000);

    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [importId, setIsLoading, onAnalysisSuccess]);

  useEffect(() => {
    if (importId && !analysis) {
      startAnalysis();
    }
  }, [importId, analysis, startAnalysis]);

  const retryAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setProgress(0);
    startAnalysis();
  };

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'transactions': return 'bg-blue-100 text-blue-800';
      case 'accounts': return 'bg-green-100 text-green-800';
      case 'categories': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={retryAnalysis} variant="outline">
          <Brain className="w-4 h-4 mr-2" />
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (isLoading || !analysis) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Analyzing your CSV data...</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI is examining the structure and content of your file
          </p>
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
        </div>

        <div className="text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
          <h4 className="font-medium text-sm mb-2">What we are analyzing:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>&bull; Data type detection</li>
            <li>&bull; Column mapping suggestions</li>
            <li>&bull; Data quality assessment</li>
            <li>&bull; Format validation</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Complete */}
      <div className="flex items-center justify-center space-x-2">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <h3 className="font-medium text-green-600">Analysis Complete!</h3>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <h4 className="font-medium text-sm mb-2">Data Type</h4>
          <Badge className={getDataTypeColor(analysis.dataType)}>
            {analysis.dataType.charAt(0).toUpperCase() + analysis.dataType.slice(1)}
          </Badge>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <h4 className="font-medium text-sm mb-2">Confidence</h4>
          <p className={`text-lg font-bold ${getConfidenceColor(analysis.confidence)}`}>
            {analysis.confidence}%
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <h4 className="font-medium text-sm mb-2">Mapped Columns</h4>
          <p className="text-lg font-bold">
            {Object.keys(analysis.columnMappings).length} / {analysis.detectedColumns.length}
          </p>
        </div>
      </div>

      {/* Column Mappings */}
      {Object.keys(analysis.columnMappings).length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Detected Column Mappings</h4>
          <div className="space-y-2">
            {Object.entries(analysis.columnMappings).map(([csvCol, dbField]) => (
              <div key={csvCol} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="font-mono text-sm">{csvCol}</span>
                <span className="text-sm text-muted-foreground">→</span>
                <Badge variant="secondary">{dbField}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">AI Suggestions</h4>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{String(suggestion)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Potential Issues:</strong>
            <ul className="mt-2 space-y-1">
              {analysis.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-sm">&bull; {String(warning)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-proceeding message */}
      <div className="text-center text-sm text-muted-foreground">
        Proceeding to preview step...
      </div>
    </div>
  );
} 