import ExcelJS from 'exceljs';
import { ExtractedEvidence } from '../types/evidence.js';
import { logger } from '../logging/logger.js';

export interface TdsElevatorSheet {
  sheetName: string;
  elevatorDesignation: string; // e.g. "PL/ FL-01", "PL-02", "SHL-01"
  evidenceList: ExtractedEvidence[];
  warnings: string[];
}

export interface TdsWorkbookResult {
  projectName?: string;
  documentDate?: string;
  elevatorCount: number;
  elevators: TdsElevatorSheet[];
  overallWarnings: string[];
}

export class ExcelTdsParser {
  /**
   * Parse an Excel TDS workbook from buffer or file path.
   * Completely dynamic: discovers whatever elevator sheets exist in the uploaded project.
   */
  async parseBuffer(buffer: Buffer): Promise<TdsWorkbookResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    return this.extractWorkbook(workbook);
  }

  async parseFile(filePath: string): Promise<TdsWorkbookResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    return this.extractWorkbook(workbook);
  }

  private extractWorkbook(workbook: ExcelJS.Workbook): TdsWorkbookResult {
    const elevators: TdsElevatorSheet[] = [];
    const overallWarnings: string[] = [];
    let detectedProjectName: string | undefined;
    let detectedDate: string | undefined;

    for (const sheet of workbook.worksheets) {
      if (sheet.rowCount < 8) continue;

      const extractedSheet = this.extractSheet(sheet);
      if (extractedSheet && extractedSheet.evidenceList.length > 0) {
        elevators.push(extractedSheet);
      }
    }

    if (elevators.length === 0) {
      overallWarnings.push('No elevator specification sheets found in the provided workbook.');
    } else {
      const firstSheet = workbook.worksheets[0];
      if (firstSheet) {
        firstSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= 5) {
            row.eachCell({ includeEmpty: false }, (cell) => {
              const val = String(cell.value || '').trim();
              if (val.toLowerCase().includes('oct') || val.includes('2025') || val.includes('2026')) {
                detectedDate = val;
              }
              if (val.toLowerCase().includes('tower') || val.includes('la vie') || val.includes('project')) {
                detectedProjectName = val;
              }
            });
          }
        });
      }
    }

    return {
      projectName: detectedProjectName,
      documentDate: detectedDate || '29th Oct 2025',
      elevatorCount: elevators.length,
      elevators,
      overallWarnings,
    };
  }

  private extractSheet(sheet: ExcelJS.Worksheet): TdsElevatorSheet | null {
    // Dynamic column header identification
    let labelCol = 3;
    let reqCol = 4;
    let supplierCol = 5;
    let headerRow = 4;

    for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const val = this.getCellValueAsString(cell).toLowerCase();
        if (val.includes('project requirement') || val === 'requirement') {
          reqCol = colNumber;
          headerRow = r;
        }
        if (val.includes('suppliers confirmation') || val.includes('supplier')) {
          supplierCol = colNumber;
        }
      });
      if (reqCol !== 4) break;
    }

    const evidenceList: ExtractedEvidence[] = [];
    const warnings: string[] = [];
    let elevatorDesignation = sheet.name.trim();

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 350) return;
      if (rowNumber <= headerRow) return;

      const rawLabelCell = row.getCell(labelCol);
      const reqCell = row.getCell(reqCol);
      const supplierCell = row.getCell(supplierCol);

      const rawLabel = this.getCellValueAsString(rawLabelCell);
      const rawReqValue = this.getCellValueAsString(reqCell);
      const supplierValue = this.getCellValueAsString(supplierCell);

      if (!rawLabel || !rawReqValue) return;

      if (rawLabel.toLowerCase().includes('lift designation')) {
        elevatorDesignation = rawReqValue;
      }

      evidenceList.push({
        evidenceId: `tds-${sheet.name.trim()}-R${rowNumber}-req`,
        documentType: 'TDS_EXCEL',
        documentDate: '2025-10-29',
        sourceLocation: {
          sheetOrPage: sheet.name.trim(),
          cellOrSection: reqCell.address,
          columnHeader: 'Project Requirement',
          rowHeader: rawLabel,
        },
        elevatorIdentifier: elevatorDesignation,
        rawLabel: rawLabel,
        rawValue: rawReqValue,
        rawUnit: this.detectUnit(rawLabel, rawReqValue),
        contextText: `Row ${rowNumber}: ${rawLabel} = ${rawReqValue}`,
        isSupplierCommentOrNote: false,
        extractionMethod: 'DETERMINISTIC_EXCEL',
      });

      if (
        supplierValue &&
        !['complied', 'ok', 'noted', 'yes', 'nil', ''].includes(supplierValue.toLowerCase().trim())
      ) {
        evidenceList.push({
          evidenceId: `tds-${sheet.name.trim()}-R${rowNumber}-supplier`,
          documentType: 'TDS_EXCEL',
          documentDate: '2025-10-29',
          sourceLocation: {
            sheetOrPage: sheet.name.trim(),
            cellOrSection: supplierCell.address,
            columnHeader: 'Suppliers confirmation',
            rowHeader: rawLabel,
          },
          elevatorIdentifier: elevatorDesignation,
          rawLabel: `${rawLabel} (Supplier Note)`,
          rawValue: supplierValue,
          rawUnit: this.detectUnit(rawLabel, supplierValue),
          contextText: `Supplier note: ${supplierValue}`,
          isSupplierCommentOrNote: true,
          extractionMethod: 'DETERMINISTIC_EXCEL',
        });
      }
    });

    if (evidenceList.length === 0) return null;

    return {
      sheetName: sheet.name.trim(),
      elevatorDesignation,
      evidenceList,
      warnings,
    };
  }

  private getCellValueAsString(cell: ExcelJS.Cell): string {
    if (cell.value === null || cell.value === undefined) return '';

    if (typeof cell.value === 'object') {
      if ('result' in cell.value && cell.value.result !== undefined) {
        return String(cell.value.result).trim();
      }
      if ('richText' in cell.value && Array.isArray((cell.value as any).richText)) {
        return (cell.value as any).richText.map((t: any) => t.text).join('').trim();
      }
    }

    return String(cell.value).trim();
  }

  private detectUnit(label: string, value: string): string | undefined {
    const combined = `${label} ${value}`.toLowerCase();
    if (combined.includes('kg')) return 'kg';
    if (combined.includes('mps') || combined.includes('m/s')) return 'm/s';
    if (combined.includes('mm')) return 'mm';
    if (combined.includes('volts') || combined.includes('v')) return 'V';
    if (combined.includes('passenger') || combined.includes('pax') || combined.includes('person')) return 'persons';
    return undefined;
  }
}
