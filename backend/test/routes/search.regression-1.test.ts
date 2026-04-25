// Regression: ISSUE-001 — global search returned protected customers by their original initials
// Found by /qa on 2026-04-25
// Report: .gstack/qa-reports/qa-report-localhost-2026-04-25.md

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import searchRoutes from '../../src/routes/search';
import { generateAlias } from '../../src/utils/alias';

jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: () => void) => {
    req.user = { id: 1, role: 'admin', name: 'Test Admin' };
    next();
  },
}));

jest.mock('../../src/middleware/validation', () => ({
  sanitizeTextInputs: (_req: any, _res: any, next: () => void) => next(),
}));

jest.mock('../../src/middleware/rateLimit', () => ({
  TOO_MANY_REQUESTS_RESPONSE: { error: 'rate_limit' },
  rateLimitKeyGenerator: () => 'test',
}));

const protectedCustomer = {
  id: 42,
  initials: 'TT',
  gender: 'Flicka',
  birth_year: 2015,
  is_protected: true,
  is_group: false,
  active: true,
};

function buildApp(query: jest.Mock) {
  const pool = { query } as unknown as Pool;
  const app = express();
  app.use(bodyParser.json());
  app.use(searchRoutes(pool));
  return app;
}

describe('search regression: protected customers must not match by original initials', () => {
  it('returns no result when querying by the original initials of a protected customer', async () => {
    const query = jest.fn()
      // assigned cases for viewer
      .mockResolvedValueOnce({ rows: [] })
      // unprotected customers — original initials filtered out by the SQL change
      .mockResolvedValueOnce({ rows: [] })
      // handlers, efforts, cases, shifts
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const app = buildApp(query);
    const res = await request(app).get('/?q=TT');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);

    const customersCall = (query.mock.calls as any[]).find(
      ([sql]) => typeof sql === 'string' && sql.toLowerCase().includes('from customers') && sql.toLowerCase().includes('initials ilike')
    );
    expect(customersCall?.[0]).toMatch(/is_protected.*= FALSE/i);
  });

  it('returns a protected customer when the query matches their viewer-specific alias', async () => {
    const alias = generateAlias(protectedCustomer.id, 1);
    const aliasPrefix = alias.slice(0, 7);

    const query = jest.fn()
      // assigned cases
      .mockResolvedValueOnce({ rows: [] })
      // unprotected customers — empty
      .mockResolvedValueOnce({ rows: [] })
      // protected candidates — the protected customer
      .mockResolvedValueOnce({ rows: [protectedCustomer] })
      // handlers, efforts, cases, shifts
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const app = buildApp(query);
    const res = await request(app).get(`/?q=${encodeURIComponent(aliasPrefix)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe(`Kund: ${alias}`);
    expect(res.body[0].data.is_protected).toBe(true);
  });
});
