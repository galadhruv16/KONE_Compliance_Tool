import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ExcelTdsParser } from '../src/parsers/excel.parser.js';
import { PdfKtocParser } from '../src/parsers/pdf.parser.js';
import { ComplianceEngine } from '../src/engine/compliance.engine.js';
import { MockGroqProvider } from '../src/services/groq/groq.mock.js';

describe('Deterministic Compliance Engine (End-to-End)', () => {
  const tdsParser = new ExcelTdsParser();
  const pdfParser = new PdfKtocParser();
  const mockGroq = new MockGroqProvider();
  const engine = new ComplianceEngine(mockGroq);

  const tdsPath = path.resolve('../test_fixtures/sample_tds.xlsx');
  const ktocPath = path.resolve('../test_fixtures/sample_ktoc.pdf');

  it('runs dynamic comparison between sample TDS and KTOC documents', async () => {
    const tdsResult = await tdsParser.parseFile(tdsPath);
    const ktocBuffer = fs.readFileSync(ktocPath);
    const ktocResult = await pdfParser.parseBuffer(ktocBuffer);

    const report = await engine.compare(tdsResult, ktocResult);

    assert.ok(report.jobId);
    assert.strictEqual(report.elevators.length, tdsResult.elevators.length);

    console.log('\n--- Real Compliance Summary ---');
    console.log(`Total Elevators Compared: ${report.overallSummary.totalElevators}`);
    console.log(`Matches: ${report.overallSummary.totalMatches}`);
    console.log(`Mismatches: ${report.overallSummary.totalMismatches}`);
    console.log(`Review Required: ${report.overallSummary.totalReviewRequired}`);

    // Verify Elevator 1 (PL-FL-01)
    const elev1 = report.elevators[0];
    assert.ok(elev1);
    assert.strictEqual(elev1.tdsElevatorId.trim(), '1.1_PL-FL-01');
    assert.strictEqual(elev1.ktocElevatorId, 'C-PL01');

    // Speed comparison (4 m/s in both documents -> MATCH)
    const speedParam = elev1.parameters.find((p) => p.canonicalKey === 'RATED_SPEED_MPS');
    assert.ok(speedParam);
    assert.strictEqual(speedParam.status, 'MATCH');
    assert.strictEqual(speedParam.normalizedTdsValue, 4);
    assert.strictEqual(speedParam.normalizedKtocValue, 4);

    // Rated load capacity comparison (TDS has 1360 kg, KTOC has 1350 kg -> MISMATCH)
    const loadParam = elev1.parameters.find((p) => p.canonicalKey === 'RATED_LOAD_KG');
    assert.ok(loadParam);
    assert.strictEqual(loadParam.status, 'MISMATCH');
    assert.strictEqual(loadParam.normalizedTdsValue, 1360);
    assert.strictEqual(loadParam.normalizedKtocValue, 1350);
  });
});
