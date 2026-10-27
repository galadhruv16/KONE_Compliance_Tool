import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PdfKtocParser } from '../src/parsers/pdf.parser.js';

describe('PDF KTOC Parser (Dynamic Multi-Elevator Extraction)', () => {
  const parser = new PdfKtocParser();
  const sampleFilePath = path.resolve('../test_fixtures/sample_ktoc.pdf');

  it('dynamically extracts project metadata and discovers elevator identifiers', async () => {
    const buffer = fs.readFileSync(sampleFilePath);
    const result = await parser.parseBuffer(buffer);

    assert.ok(result.totalElevatorsCount !== undefined, 'Total elevators should be parsed from cover page');
    assert.strictEqual(result.totalElevatorsCount, 7);
    assert.ok(result.orderNumber === '6900946');
    assert.ok(result.tenderNumber === 'T-0008789768');

    // Verify all discovered elevators across the groups
    const elevatorNames = result.elevators.map((e) => e.elevatorName);
    console.log('Discovered KTOC Elevators:', elevatorNames);
    assert.ok(elevatorNames.includes('C-PL01'));
    assert.ok(elevatorNames.includes('C-PL02'));
    assert.ok(elevatorNames.includes('C-PL03'));
    assert.ok(elevatorNames.includes('C-PL04'));
  });

  it('extracts technical values with exact column and page provenance', async () => {
    const buffer = fs.readFileSync(sampleFilePath);
    const result = await parser.parseBuffer(buffer);

    const cpl01 = result.elevators.find((e) => e.elevatorName === 'C-PL01');
    assert.ok(cpl01, 'C-PL01 must be present');

    const ratedLoad = cpl01.evidenceList.find((e) => e.rawLabel.includes('Rated load'));
    assert.ok(ratedLoad, 'Rated load should be extracted for C-PL01');
    assert.strictEqual(ratedLoad.rawValue, '1350');
    assert.strictEqual(ratedLoad.rawUnit, 'kg');

    const speed = cpl01.evidenceList.find((e) => e.rawLabel.includes('Rated Speed'));
    assert.ok(speed, 'Rated speed should be extracted for C-PL01');
    assert.strictEqual(speed.rawValue, '4');
  });
});
