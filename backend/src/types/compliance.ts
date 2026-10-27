import { ExtractedEvidence } from './evidence.js';

export type ComparisonStatus =
  | 'MATCH'
  | 'MISMATCH'
  | 'MISSING_IN_TDS'
  | 'MISSING_IN_KTOC'
  | 'REVIEW_REQUIRED'
  | 'NOT_COMPARABLE';

export type MappingProvenance =
  | 'EXACT_RULE'
  | 'LLM_INTERPRETED_APPROVED'
  | 'HUMAN_OVERRIDE';

export interface ParameterComparisonResult {
  canonicalKey: string;
  displayName: string;
  category: 'CAPACITY' | 'SPEED' | 'CAR_DIMENSIONS' | 'SHAFT_DIMENSIONS' | 'DOORS' | 'ELECTRICAL' | 'GENERAL';
  status: ComparisonStatus;
  tdsEvidence: ExtractedEvidence | null;
  ktocEvidence: ExtractedEvidence | null;
  normalizedTdsValue: number | string | null;
  normalizedKtocValue: number | string | null;
  unit: string | null;
  mappingSource: MappingProvenance;
  reviewReason?: string;
  confidenceScore?: number;
}

export interface ElevatorComparisonResult {
  elevatorIndex: number;
  tdsElevatorId: string;
  ktocElevatorId: string;
  mappingConfidence: number;
  isIdentifierConfirmed: boolean;
  parameters: ParameterComparisonResult[];
  summary: {
    total: number;
    matches: number;
    mismatches: number;
    reviewRequired: number;
    missingInTds: number;
    missingInKtoc: number;
    notComparable: number;
  };
}

export interface ComplianceReport {
  jobId: string;
  comparisonTimestamp: string;
  metadata: {
    tdsFilename: string;
    ktocFilename: string;
    tdsDocumentDate?: string;
    ktocDocumentDate?: string;
    groqInterpretationUsed: boolean;
    warnings: string[];
  };
  overallSummary: {
    totalElevators: number;
    totalParameters: number;
    totalMatches: number;
    totalMismatches: number;
    totalReviewRequired: number;
  };
  elevators: ElevatorComparisonResult[];
}
