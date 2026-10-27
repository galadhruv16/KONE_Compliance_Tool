import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import path from 'node:path';
import { createApp } from '../src/app.js';

describe('Compliance Compare API Route (POST /api/v1/compliance/compare)', () => {
  const app = createApp();
  const tdsPath = path.resolve('../test_fixtures/sample_tds.xlsx');
  const ktocPath = path.resolve('../test_fixtures/sample_ktoc.pdf');

  it('rejects requests missing either file with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/compliance/compare')
      .attach('tdsFile', tdsPath);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'MISSING_FILES');
  });

  it('successfully processes both uploaded documents and returns compliance report', async () => {
    const res = await request(app)
      .post('/api/v1/compliance/compare')
      .attach('tdsFile', tdsPath)
      .attach('ktocFile', ktocPath);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.jobId);
    assert.ok(res.body.data.overallSummary);
    assert.ok(Array.isArray(res.body.data.elevators));
    assert.strictEqual(res.body.data.elevators.length, 7);
  });
});
