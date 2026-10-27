import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage.js';
import { ProcessingModal, ProgressStep } from './components/ProcessingModal.js';
import { ResultsDashboard, ElevatorReportData, ComplianceSummary } from './pages/ResultsDashboard.js';

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<'LANDING' | 'RESULTS'>('LANDING');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [tdsName, setTdsName] = useState('');
  const [ktocName, setKtocName] = useState('');
  const [, setErrorMessage] = useState<string | null>(null);

  const [reportData, setReportData] = useState<{
    summary: ComplianceSummary;
    elevators: ElevatorReportData[];
  } | null>(null);

  const steps: ProgressStep[] = [
    {
      label: 'Parsing TDS Excel Worksheets',
      detail: 'Extracting variable project elevator worksheets & cell coordinates',
      status: processingStepIndex > 0 ? 'COMPLETED' : processingStepIndex === 0 ? 'ACTIVE' : 'PENDING',
    },
    {
      label: 'Parsing KTOC PDF Layout & Columns',
      detail: 'Extracting multi-page specifications & column-grouped elevator parameters',
      status: processingStepIndex > 1 ? 'COMPLETED' : processingStepIndex === 1 ? 'ACTIVE' : 'PENDING',
    },
    {
      label: 'Semantic Normalization & Groq Interpretation',
      detail: 'Associating customer labels and resolving provisional elevator tags',
      status: processingStepIndex > 2 ? 'COMPLETED' : processingStepIndex === 2 ? 'ACTIVE' : 'PENDING',
    },
    {
      label: 'Deterministic Comparison Engine',
      detail: 'Evaluating engineering tolerances, dimensions, and capacities',
      status: processingStepIndex >= 3 ? 'COMPLETED' : 'PENDING',
    },
  ];

  const handleStartComparison = async (tdsFile: File, ktocFile: File) => {
    setTdsName(tdsFile.name);
    setKtocName(ktocFile.name);
    setIsProcessing(true);
    setProcessingStepIndex(0);
    setErrorMessage(null);

    const stepInterval = setInterval(() => {
      setProcessingStepIndex((prev) => Math.min(prev + 1, 3));
    }, 600);

    try {
      const formData = new FormData();
      formData.append('tdsFile', tdsFile);
      formData.append('ktocFile', ktocFile);

      const response = await fetch('http://localhost:5050/api/v1/compliance/compare', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepInterval);
      setProcessingStepIndex(3);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Server responded with ${response.status}`);
      }

      const resJson = await response.json();
      const report = resJson.data;

      // Transform backend API report to frontend format
      const summary: ComplianceSummary = {
        totalElevators: report.overallSummary.totalElevators,
        totalParameters: report.overallSummary.totalParameters,
        matches: report.overallSummary.totalMatches,
        mismatches: report.overallSummary.totalMismatches,
        reviewRequired: report.overallSummary.totalReviewRequired,
        tdsDate: report.metadata.tdsDocumentDate || 'N/A',
        ktocDate: report.metadata.ktocDocumentDate || 'N/A',
      };

      const elevators: ElevatorReportData[] = report.elevators.map((el: any) => ({
        tdsId: el.tdsElevatorId,
        ktocId: el.ktocElevatorId,
        parameters: el.parameters.map((p: any) => ({
          canonicalKey: p.canonicalKey,
          displayName: p.displayName,
          category: p.category,
          tdsValue: p.tdsEvidence ? `${p.normalizedTdsValue ?? p.tdsEvidence.rawValue} ${p.unit || ''}`.trim() : 'Missing',
          tdsSource: p.tdsEvidence ? `${p.tdsEvidence.sourceLocation.sheetOrPage}!${p.tdsEvidence.sourceLocation.cellOrSection || ''}` : 'N/A',
          ktocValue: p.ktocEvidence ? `${p.normalizedKtocValue ?? p.ktocEvidence.rawValue} ${p.unit || ''}`.trim() : 'Missing',
          ktocSource: p.ktocEvidence ? `${p.ktocEvidence.sourceLocation.sheetOrPage} (${p.ktocEvidence.sourceLocation.cellOrSection || ''})` : 'N/A',
          status: p.status,
          mappingSource: p.mappingSource,
          reviewReason: p.reviewReason,
        })),
      }));

      setReportData({ summary, elevators });
      setIsProcessing(false);
      setViewState('RESULTS');
    } catch (err) {
      clearInterval(stepInterval);
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : String(err));
      alert(`Comparison failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div>
      {viewState === 'LANDING' && (
        <LandingPage onStartComparison={handleStartComparison} />
      )}

      {viewState === 'RESULTS' && reportData && (
        <ResultsDashboard
          summary={reportData.summary}
          elevators={reportData.elevators}
          onNewComparison={() => setViewState('LANDING')}
        />
      )}

      <ProcessingModal
        isOpen={isProcessing}
        steps={steps}
        currentStepIndex={processingStepIndex}
        tdsName={tdsName}
        ktocName={ktocName}
      />
    </div>
  );
};
