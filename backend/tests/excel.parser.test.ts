import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { ExcelTdsParser } from '../src/parsers/excel.parser.js';

describe('Excel TDS Parser (Dynamic Multi-Elevator Extraction)', () => {
  const parser = new ExcelTdsParser();
  const sampleFilePath = path.resolve('../test_fixtures/sample_tds.xlsx');

  it('dynamically extracts all elevator sheets from any workbook', async () => {
    const result = await parser.parseFile(sampleFilePath);

    assert.ok(result.elevatorCount > 0, 'Should find at least 1 elevator sheet');
    assert.strictEqual(result.elevators.length, result.elevatorCount);

    const sheetNames = result.elevators.map((s) => s.sheetName);
    assert.ok(sheetNames.some((n) => n.includes('PL-FL-01')));
    assert.ok(sheetNames.some((n) => n.includes('PL-02')));
    assert.ok(sheetNames.some((n) => n.includes('SHL-01')));
  });

  it('extracts key technical parameters and preserves cell coordinates', async () => {
    const result = await parser.parseFile(sampleFilePath);
    const firstSheet = result.elevators[0];
    assert.ok(firstSheet);

    const capacityEvidence = firstSheet.evidenceList.find((e) =>
      e.rawLabel.toLowerCase().includes('capacity')
    );
    assert.ok(capacityEvidence, 'Capacity evidence should be extracted');
    assert.strictEqual(capacityEvidence.rawValue, '1360 / 20');
    assert.strictEqual(capacityEvidence.sourceLocation.columnHeader, 'Project Requirement');
    assert.ok(capacityEvidence.sourceLocation.cellOrSection?.includes('D9'));

    const speedEvidence = firstSheet.evidenceList.find((e) =>
      e.rawLabel.toLowerCase().includes('speed')
    );
    assert.ok(speedEvidence, 'Speed evidence should be extracted');
    assert.strictEqual(speedEvidence.rawValue, '4');
  });

  it('distinguishes customer requirements from supplier counter-proposals', async () => {
    const result = await parser.parseFile(sampleFilePath);
    const firstSheet = result.elevators[0];
    assert.ok(firstSheet);

    // Row 22 has customer requirement "1300 W x 2400 D x 2400 H" and supplier note "Complied with 1300 x 2350 x 2400"
    const reqEvidence = firstSheet.evidenceList.find(
      (e) => !e.isSupplierCommentOrNote && e.rawLabel.toLowerCase().includes('cabin size')
    );
    assert.ok(reqEvidence);
    assert.strictEqual(reqEvidence.rawValue, '1300 W x 2400 D x 2400 H');

    const supplierEvidence = firstSheet.evidenceList.find(
      (e) => e.isSupplierCommentOrNote && e.rawLabel.toLowerCase().includes('cabin size')
    );
    assert.ok(supplierEvidence, 'Supplier comment evidence should be extracted separately');
    assert.ok(supplierEvidence.rawValue.includes('2350'));
  });
});
