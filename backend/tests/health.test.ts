import { describe, it } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health Check API', () => {
  const app = createApp();

  it('GET /api/v1/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.deepStrictEqual(res.body.data, {
      status: 'UP',
      service: 'kone-compliance-checker',
    });
    assert.ok(res.headers['x-correlation-id'], 'Response should include x-correlation-id header');
  });

  it('preserves a valid incoming x-correlation-id header', async () => {
    const customCorrelationId = 'test-corr-id-12345';
    const res = await request(app)
      .get('/api/v1/health')
      .set('x-correlation-id', customCorrelationId);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['x-correlation-id'], customCorrelationId);
  });
});
