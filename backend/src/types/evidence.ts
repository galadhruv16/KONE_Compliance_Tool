export type DocumentType = 'TDS_EXCEL' | 'KTOC_PDF';

export interface SourceLocation {
  sheetOrPage: string; // e.g. "1.1_PL-FL-01" or "Page 14"
  cellOrSection?: string; // e.g. "B12:D12" or "Table 3.2 - Shaft Specs"
  columnHeader?: string; // Column header text in table or sheet
  rowHeader?: string; // Row descriptor text if applicable
}

export interface ExtractedEvidence {
  evidenceId: string;
  documentType: DocumentType;
  documentDate?: string;
  sourceLocation: SourceLocation;
  elevatorIdentifier: string; // e.g. "PL-01", "C-PL01"
  rawLabel: string;
  rawValue: string;
  rawUnit?: string;
  contextText?: string;
  isSupplierCommentOrNote: boolean;
  extractionMethod: 'DETERMINISTIC_EXCEL' | 'DETERMINISTIC_PDF' | 'FALLBACK_LAYOUT';
  extractionWarnings?: string[];
}
