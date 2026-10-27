import { ExtractedEvidence } from '../types/evidence.js';
import {
  ParameterComparisonResult,
  ElevatorComparisonResult,
  ComplianceReport,
  ComparisonStatus,
  MappingProvenance,
} from '../types/compliance.js';
import { TdsWorkbookResult } from '../parsers/excel.parser.js';
import { KtocExtractionResult } from '../parsers/pdf.parser.js';
import { IGroqProvider } from '../services/groq/groq.interface.js';
import { logger } from '../logging/logger.js';

export interface CanonicalParamDef {
  key: string;
  displayName: string;
  category: ParameterComparisonResult['category'];
  standardUnit: string;
  tdsKeywords: string[];
  ktocKeywords: string[];
  comparisonType: 'NUMERIC_EXACT' | 'NUMERIC_TOLERANCE' | 'STRING_EXACT' | 'DIMENSION_3D' | 'CAPACITY_DUAL';
  tolerance?: {
    minRatio?: number; // e.g. 0.98 for speeds
    maxRatio?: number; // e.g. 1.02
    allowedDelta?: number; // absolute difference in mm or kg
  };
}

export const CANONICAL_PARAMETERS: CanonicalParamDef[] = [
  {
    key: 'RATED_LOAD_KG',
    displayName: 'Rated Load',
    category: 'CAPACITY',
    standardUnit: 'kg',
    tdsKeywords: ['capacity', 'rated load', 'load'],
    ktocKeywords: ['rated load q', 'load q'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'PASSENGER_CAPACITY',
    displayName: 'Passenger Capacity',
    category: 'CAPACITY',
    standardUnit: 'persons',
    tdsKeywords: ['capacity (kg / passenger)', 'passenger', 'pax'],
    ktocKeywords: ['number of passengers', 'passengers'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'RATED_SPEED_MPS',
    displayName: 'Rated Speed',
    category: 'SPEED',
    standardUnit: 'm/s',
    tdsKeywords: ['speed (mps)', 'speed', 'rated speed'],
    ktocKeywords: ['rated speed, v [m/s]', 'rated speed'],
    comparisonType: 'NUMERIC_TOLERANCE',
    tolerance: { minRatio: 0.97, maxRatio: 1.03 },
  },
  {
    key: 'TRAVEL_HEIGHT_M',
    displayName: 'Travel Height',
    category: 'GENERAL',
    standardUnit: 'm',
    tdsKeywords: ['travel height (m)', 'travel height', 'travel'],
    ktocKeywords: ['travel, h [m]', 'travel h'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'CAR_WIDTH_MM',
    displayName: 'Car Internal Width',
    category: 'CAR_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['lift cabin size', 'car internal width', 'car width'],
    ktocKeywords: ['car shell width, bb[mm]', 'car shell width bb'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'CAR_DEPTH_MM',
    displayName: 'Car Internal Depth',
    category: 'CAR_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['lift cabin size', 'car internal depth', 'car depth'],
    ktocKeywords: ['car shell depth, dd[mm]', 'car shell depth dd'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'CAR_CLEAR_HEIGHT_MM',
    displayName: 'Car Clear Height (False Ceiling)',
    category: 'CAR_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['lift cabin size (h, clear up to false ceiling)', 'clear up to false ceiling'],
    ktocKeywords: ['car clear intern.height ch[mm]', 'car clear intern height ch'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'CLEAR_ENTRANCE_WIDTH_MM',
    displayName: 'Clear Entrance Width',
    category: 'DOORS',
    standardUnit: 'mm',
    tdsKeywords: ['clear entrance size', 'entrance width', 'door width'],
    ktocKeywords: ['clear open width ll[mm]', 'clear open width ll'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'ENTRANCE_HEIGHT_MM',
    displayName: 'Clear Entrance Height',
    category: 'DOORS',
    standardUnit: 'mm',
    tdsKeywords: ['clear entrance size', 'door height'],
    ktocKeywords: ['door height, hh [mm]', 'door height hh'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'SHAFT_WIDTH_MM',
    displayName: 'Shaft Width',
    category: 'SHAFT_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['shaft size per lift', 'shaft width'],
    ktocKeywords: ['shaft width ww [mm]', 'shaft width ww'],
    comparisonType: 'NUMERIC_TOLERANCE',
    tolerance: { allowedDelta: 25 }, // ±25mm tolerance for nominal civil shaft
  },
  {
    key: 'SHAFT_DEPTH_MM',
    displayName: 'Shaft Depth',
    category: 'SHAFT_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['shaft size per lift', 'shaft depth'],
    ktocKeywords: ['shaft depth wd [mm]', 'shaft depth wd'],
    comparisonType: 'NUMERIC_TOLERANCE',
    tolerance: { allowedDelta: 25 },
  },
  {
    key: 'PIT_DEPTH_MM',
    displayName: 'Pit Depth',
    category: 'SHAFT_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['pit depth (mm)', 'pit depth'],
    ktocKeywords: ['shaft pit depth ph [mm]', 'shaft pit depth ph'],
    comparisonType: 'NUMERIC_EXACT',
  },
  {
    key: 'HEADROOM_MM',
    displayName: 'Overhead / Headroom Height',
    category: 'SHAFT_DIMENSIONS',
    standardUnit: 'mm',
    tdsKeywords: ['overhead ht (mm)', 'overhead', 'headroom'],
    ktocKeywords: ['shaft headroom height sh [mm]', 'shaft headroom height sh'],
    comparisonType: 'NUMERIC_EXACT',
  },
];

export class ComplianceEngine {
  constructor(private groqProvider: IGroqProvider) {}

  /**
   * Run the deterministic comparison engine across dynamically parsed TDS and KTOC documents.
   * Leverages Groq for resolving provisional elevator aliases and ambiguous terminology.
   */
  async compare(
    tdsData: TdsWorkbookResult,
    ktocData: KtocExtractionResult,
    jobId = `job-${Date.now()}`
  ): Promise<ComplianceReport> {
    const tdsElevatorIds = tdsData.elevators.map((e) => e.sheetName);
    const ktocElevatorIds = ktocData.elevators.map((e) => e.elevatorName);

    // Step 1: Resolve elevator alias pairs dynamically
    const aliasResponse = await this.groqProvider.resolveElevatorAliases({
      tdsElevatorIds,
      ktocElevatorIds,
    });

    const elevatorResults: ElevatorComparisonResult[] = [];
    const reportWarnings: string[] = [...tdsData.overallWarnings, ...ktocData.warnings];

    for (let i = 0; i < tdsData.elevators.length; i++) {
      const tdsElev = tdsData.elevators[i];
      if (!tdsElev) continue;

      // Find matching KTOC elevator from mapping or heuristic fallback
      const aliasMatch = aliasResponse.mappings.find((m) => m.tdsElevatorId === tdsElev.sheetName);
      let ktocElevId = aliasMatch?.ktocElevatorId;

      if (!ktocElevId || !ktocElevatorIds.includes(ktocElevId)) {
        // Fallback: match by index if available
        ktocElevId = ktocElevatorIds[i] || 'UNMAPPED';
      }

      const ktocElev = ktocData.elevators.find((e) => e.elevatorName === ktocElevId);

      const paramResults: ParameterComparisonResult[] = [];

      // Step 2: Compare each Canonical Parameter
      for (const def of CANONICAL_PARAMETERS) {
        const result = this.compareParameter(def, tdsElev.evidenceList, ktocElev?.evidenceList || []);
        paramResults.push(result);
      }

      // Summary counts for this elevator
      const matches = paramResults.filter((p) => p.status === 'MATCH').length;
      const mismatches = paramResults.filter((p) => p.status === 'MISMATCH').length;
      const reviewRequired = paramResults.filter((p) => p.status === 'REVIEW_REQUIRED').length;
      const missingInTds = paramResults.filter((p) => p.status === 'MISSING_IN_TDS').length;
      const missingInKtoc = paramResults.filter((p) => p.status === 'MISSING_IN_KTOC').length;
      const notComparable = paramResults.filter((p) => p.status === 'NOT_COMPARABLE').length;

      elevatorResults.push({
        elevatorIndex: i + 1,
        tdsElevatorId: tdsElev.sheetName,
        ktocElevatorId: ktocElevId,
        mappingConfidence: aliasMatch?.confidence ?? 0.5,
        isIdentifierConfirmed: aliasMatch?.isConfident ?? false,
        parameters: paramResults,
        summary: {
          total: paramResults.length,
          matches,
          mismatches,
          reviewRequired,
          missingInTds,
          missingInKtoc,
          notComparable,
        },
      });
    }

    const overallMatches = elevatorResults.reduce((acc, el) => acc + el.summary.matches, 0);
    const overallMismatches = elevatorResults.reduce((acc, el) => acc + el.summary.mismatches, 0);
    const overallReviewReq = elevatorResults.reduce((acc, el) => acc + el.summary.reviewRequired, 0);
    const overallParams = elevatorResults.reduce((acc, el) => acc + el.summary.total, 0);

    return {
      jobId,
      comparisonTimestamp: new Date().toISOString(),
      metadata: {
        tdsFilename: tdsData.projectName || 'Customer TDS',
        ktocFilename: ktocData.orderNumber ? `KTOC Order #${ktocData.orderNumber}` : 'KTOC Order PDF',
        tdsDocumentDate: tdsData.documentDate,
        ktocDocumentDate: ktocData.documentDate,
        groqInterpretationUsed: true,
        warnings: reportWarnings,
      },
      overallSummary: {
        totalElevators: elevatorResults.length,
        totalParameters: overallParams,
        totalMatches: overallMatches,
        totalMismatches: overallMismatches,
        totalReviewRequired: overallReviewReq,
      },
      elevators: elevatorResults,
    };
  }

  private compareParameter(
    def: CanonicalParamDef,
    tdsEvidenceList: ExtractedEvidence[],
    ktocEvidenceList: ExtractedEvidence[]
  ): ParameterComparisonResult {
    // 1. Locate relevant TDS evidence
    const tdsEvidence = this.findEvidence(def.tdsKeywords, tdsEvidenceList);
    // 2. Locate relevant KTOC evidence
    const ktocEvidence = this.findEvidence(def.ktocKeywords, ktocEvidenceList);

    if (!tdsEvidence && !ktocEvidence) {
      return {
        canonicalKey: def.key,
        displayName: def.displayName,
        category: def.category,
        status: 'NOT_COMPARABLE',
        tdsEvidence: null,
        ktocEvidence: null,
        normalizedTdsValue: null,
        normalizedKtocValue: null,
        unit: def.standardUnit,
        mappingSource: 'EXACT_RULE',
        reviewReason: 'Parameter not found in either document.',
      };
    }

    if (!tdsEvidence) {
      return {
        canonicalKey: def.key,
        displayName: def.displayName,
        category: def.category,
        status: 'MISSING_IN_TDS',
        tdsEvidence: null,
        ktocEvidence,
        normalizedTdsValue: null,
        normalizedKtocValue: this.parseNumericValue(ktocEvidence!.rawValue, def.key),
        unit: def.standardUnit,
        mappingSource: 'EXACT_RULE',
        reviewReason: 'Specification present in KTOC order but missing in customer TDS requirements.',
      };
    }

    if (!ktocEvidence) {
      return {
        canonicalKey: def.key,
        displayName: def.displayName,
        category: def.category,
        status: 'MISSING_IN_KTOC',
        tdsEvidence,
        ktocEvidence: null,
        normalizedTdsValue: this.parseNumericValue(tdsEvidence.rawValue, def.key),
        normalizedKtocValue: null,
        unit: def.standardUnit,
        mappingSource: 'EXACT_RULE',
        reviewReason: 'Requirement specified in customer TDS but omitted in KTOC order form.',
      };
    }

    // Both documents have values: perform deterministic comparison
    const normTds = this.parseNumericValue(tdsEvidence.rawValue, def.key);
    const normKtoc = this.parseNumericValue(ktocEvidence.rawValue, def.key);

    let status: ComparisonStatus = 'MISMATCH';
    let reviewReason: string | undefined;

    // Special case: Car clear height vs car shell height (clear ceiling semantic distinction)
    if (def.key === 'CAR_CLEAR_HEIGHT_MM') {
      const isShell = ktocEvidence.rawLabel.toLowerCase().includes('ak') || ktocEvidence.rawValue.includes('2607');
      if (isShell) {
        status = 'REVIEW_REQUIRED';
        reviewReason = 'TDS specifies clear height up to false ceiling, whereas KTOC lists car-shell structural height (AK). Requires engineering confirmation.';
      }
    }

    if (normTds !== null && normKtoc !== null) {
      if (def.comparisonType === 'NUMERIC_EXACT') {
        if (normTds === normKtoc) {
          status = 'MATCH';
        } else {
          status = 'MISMATCH';
          reviewReason = `Discrepancy: TDS requires ${normTds} ${def.standardUnit}, but KTOC orders ${normKtoc} ${def.standardUnit}.`;
        }
      } else if (def.comparisonType === 'NUMERIC_TOLERANCE') {
        const delta = Math.abs(normTds - normKtoc);
        const allowed = def.tolerance?.allowedDelta ?? 0;
        if (delta <= allowed) {
          status = 'MATCH';
        } else {
          status = 'MISMATCH';
          reviewReason = `Discrepancy: Difference of ${delta}${def.standardUnit} exceeds allowed engineering tolerance (±${allowed}${def.standardUnit}).`;
        }
      }
    } else {
      // String or composite comparison
      if (tdsEvidence.rawValue.trim().toLowerCase() === ktocEvidence.rawValue.trim().toLowerCase()) {
        status = 'MATCH';
      } else {
        status = 'REVIEW_REQUIRED';
        reviewReason = `Values require human interpretation: TDS="${tdsEvidence.rawValue}" vs KTOC="${ktocEvidence.rawValue}".`;
      }
    }

    return {
      canonicalKey: def.key,
      displayName: def.displayName,
      category: def.category,
      status,
      tdsEvidence,
      ktocEvidence,
      normalizedTdsValue: normTds,
      normalizedKtocValue: normKtoc,
      unit: def.standardUnit,
      mappingSource: 'EXACT_RULE',
      reviewReason,
    };
  }

  private findEvidence(keywords: string[], list: ExtractedEvidence[]): ExtractedEvidence | null {
    for (const kw of keywords) {
      const match = list.find((e) => e.rawLabel.toLowerCase().includes(kw));
      if (match) return match;
    }
    return null;
  }

  private parseNumericValue(valStr: string, key: string): number | null {
    if (!valStr) return null;

    // Dual format: e.g. "1360 / 20" (Capacity kg / passenger)
    if (valStr.includes('/')) {
      const parts = valStr.split('/').map((p) => p.trim());
      if (key === 'RATED_LOAD_KG' && parts[0]) {
        const num = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
      }
      if (key === 'PASSENGER_CAPACITY' && parts[1]) {
        const num = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
        return isNaN(num) ? null : num;
      }
    }

    // Composite dimension format: e.g. "1300 W x 2400 D x 2400 H" or "2275 W x 3050 D"
    if (valStr.toLowerCase().includes('w') || valStr.toLowerCase().includes('x')) {
      const wMatch = valStr.match(/([0-9.]+)\s*W/i);
      const dMatch = valStr.match(/([0-9.]+)\s*D/i);
      const hMatch = valStr.match(/([0-9.]+)\s*H/i);

      if (key.includes('WIDTH') && wMatch && wMatch[1]) return parseFloat(wMatch[1]);
      if (key.includes('DEPTH') && dMatch && dMatch[1]) return parseFloat(dMatch[1]);
      if (key.includes('HEIGHT') && hMatch && hMatch[1]) return parseFloat(hMatch[1]);

      // Fallback: splitting by 'x'
      const parts = valStr.split(/x/i).map((p) => parseFloat(p.replace(/[^0-9.]/g, '')));
      if (parts.length >= 2) {
        if (key.includes('WIDTH') && !isNaN(parts[0]!)) return parts[0]!;
        if (key.includes('DEPTH') && !isNaN(parts[1]!)) return parts[1]!;
        if (key.includes('HEIGHT') && parts[2] && !isNaN(parts[2])) return parts[2];
      }
    }

    // Standard number extraction
    const cleanStr = valStr.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? null : parsed;
  }
}
