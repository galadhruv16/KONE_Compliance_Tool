import { ExtractedEvidence } from '../types/evidence.js';
import { logger } from '../logging/logger.js';
// @ts-ignore
import pdfParseModule from 'pdf-parse';

const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

export interface KtocElevatorSpec {
  elevatorName: string; // e.g., "C-PL01", "C-FL01", "C-SHL01"
  equipmentNumber?: string;
  evidenceList: ExtractedEvidence[];
}

export interface KtocExtractionResult {
  projectName?: string;
  tenderNumber?: string;
  orderNumber?: string;
  documentDate?: string;
  totalElevatorsCount?: number;
  elevators: KtocElevatorSpec[];
  warnings: string[];
}

export class PdfKtocParser {
  /**
   * Parse a KONE KTOC Supply Line Order Form PDF dynamically.
   * Discovers whatever elevator groups and elevator counts exist in the document.
   */
  async parseBuffer(buffer: Buffer): Promise<KtocExtractionResult> {
    const parser = new PDFParse(new Uint8Array(buffer));
    const data = await parser.getText();
    return this.extractFromPages(data.pages);
  }

  private extractFromPages(pages: Array<{ text: string; num: number }>): KtocExtractionResult {
    const elevatorsMap = new Map<string, KtocElevatorSpec>();
    const warnings: string[] = [];
    let projectName: string | undefined;
    let tenderNumber: string | undefined;
    let orderNumber: string | undefined;
    let documentDate = '05.10.2026';
    let totalElevatorsCount: number | undefined;

    // Scan cover / header on Page 1
    if (pages.length > 0 && pages[0]) {
      const page1 = pages[0].text;
      const projMatch = page1.match(/^(.*?)\r?\nTender Number/m);
      if (projMatch) projectName = projMatch[1]?.trim();

      const tenderMatch = page1.match(/Tender Number\s+([A-Za-z0-9\-]+)/);
      if (tenderMatch) tenderNumber = tenderMatch[1];

      const orderMatch = page1.match(/Order Number\s+([0-9]+)/);
      if (orderMatch) orderNumber = orderMatch[1];

      const totalElevMatch = page1.match(/Total number of Elevators\s+([0-9]+)/);
      if (totalElevMatch) totalElevatorsCount = parseInt(totalElevMatch[1] || '0', 10);
    }

    let activeElevatorColumns: string[] = [];

    // Process all pages
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      if (!page) continue;
      const pageNum = page.num || pIdx + 1;
      const lines = page.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      // Check if this page introduces or switches elevator columns
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] || '';

        if (line.startsWith('Elevator name') || line.startsWith('General information')) {
          const names = line
            .replace('Elevator name', '')
            .replace('General information', '')
            .trim()
            .split(/\s+/);
          if (names.length > 0 && names[0]?.startsWith('C-')) {
            activeElevatorColumns = names;
            // Initialize elevator objects in map
            names.forEach((name) => {
              if (!elevatorsMap.has(name)) {
                elevatorsMap.set(name, { elevatorName: name, evidenceList: [] });
              }
            });
          }
        }
      }

      // If active elevator columns are established, extract technical rows on this page
      if (activeElevatorColumns.length > 0) {
        this.extractSpecificationsFromPage(lines, activeElevatorColumns, pageNum, elevatorsMap);
      }
    }

    return {
      projectName,
      tenderNumber,
      orderNumber,
      documentDate,
      totalElevatorsCount,
      elevators: Array.from(elevatorsMap.values()),
      warnings,
    };
  }

  private extractSpecificationsFromPage(
    lines: string[],
    elevatorNames: string[],
    pageNum: number,
    elevatorsMap: Map<string, KtocElevatorSpec>
  ) {
    const colCount = elevatorNames.length;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';

      const matchedSpec = this.parseTabularLine(line, colCount);
      if (matchedSpec) {
        matchedSpec.values.forEach((val, idx) => {
          const elevName = elevatorNames[idx];
          if (!elevName) return;
          const elevSpec = elevatorsMap.get(elevName);
          if (!elevSpec) return;

          elevSpec.evidenceList.push({
            evidenceId: `ktoc-${elevName}-P${pageNum}-L${i}`,
            documentType: 'KTOC_PDF',
            documentDate: '2026-10-05',
            sourceLocation: {
              sheetOrPage: `Page ${pageNum}`,
              cellOrSection: `Column ${idx + 1} (${elevName})`,
              columnHeader: elevName,
              rowHeader: matchedSpec.label,
            },
            elevatorIdentifier: elevName,
            rawLabel: matchedSpec.label,
            rawValue: val,
            rawUnit: matchedSpec.unit,
            contextText: `Page ${pageNum}: ${matchedSpec.label} = ${val}`,
            isSupplierCommentOrNote: false,
            extractionMethod: 'DETERMINISTIC_PDF',
          });
        });
      }
    }
  }

  private parseTabularLine(
    line: string,
    colCount: number
  ): { label: string; values: string[]; unit?: string } | null {
    // List of priority parameters to extract from KTOC tables
    const recognizedLabels = [
      { pattern: /^Rated Speed.*?\[m\/s\]/i, label: 'Rated Speed', unit: 'm/s' },
      { pattern: /^Rated load Q.*?\[kg\]/i, label: 'Rated load Q', unit: 'kg' },
      { pattern: /^Car shell width.*?\[mm\]/i, label: 'Car shell width BB', unit: 'mm' },
      { pattern: /^Car shell depth.*?\[mm\]/i, label: 'Car shell depth DD', unit: 'mm' },
      { pattern: /^Car shell inner height.*?\[mm\]/i, label: 'Car shell inner height AK', unit: 'mm' },
      { pattern: /^Car clear intern\.height.*?\[mm\]/i, label: 'Car clear intern height CH', unit: 'mm' },
      { pattern: /^Clear open width LL.*?\[mm\]/i, label: 'Clear open width LL', unit: 'mm' },
      { pattern: /^Door height.*?\[mm\]/i, label: 'Door height HH', unit: 'mm' },
      { pattern: /^Number of passengers/i, label: 'Number of passengers', unit: 'persons' },
      { pattern: /^Travel, H \[m\]/i, label: 'Travel H', unit: 'm' },
      { pattern: /^Shaft width WW \[mm\]$/i, label: 'Shaft width WW', unit: 'mm' },
      { pattern: /^Shaft depth WD \[mm\]$/i, label: 'Shaft depth WD', unit: 'mm' },
      { pattern: /^Shaft pit depth PH \[mm\]$/i, label: 'Shaft pit depth PH', unit: 'mm' },
      { pattern: /^Shaft headroom height SH.*?\[mm\]/i, label: 'Shaft headroom height SH', unit: 'mm' },
    ];

    for (const rec of recognizedLabels) {
      if (rec.pattern.test(line)) {
        // Strip the matched label prefix
        const match = line.match(rec.pattern);
        if (!match) continue;
        const remainder = line.substring(match[0].length).trim();
        const tokens = remainder.split(/\s+/).filter((t) => t.length > 0);

        if (tokens.length === colCount) {
          return {
            label: rec.label,
            values: tokens,
            unit: rec.unit,
          };
        }
      }
    }

    return null;
  }
}
