import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
import rateLimit from "express-rate-limit";
// Optional compression (graceful if package missing)
let compression: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  compression = require('compression');
} catch {
  compression = null;
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");

import customers from "./routes/customers";
import efforts from "./routes/efforts";
import handlers from "./routes/handlers";
import cases from "./routes/cases";
import stats from "./routes/stats";
import shifts from "./routes/shifts";
import users from "./routes/users";
import invites from "./routes/invites";
import audit from "./routes/audit";
import auth from "./routes/auth";
import { initAuditLogger } from "./utils/auditLogger";
import { config } from "./config";
import { sanitizeTextInputs } from "./middleware/validation";
import { normalizeAvailableFor } from "./utils/efforts";

// Konfigurationen valideras automatiskt vid import av config

const app = express();
app.disable('x-powered-by');
app.set("trust proxy", config.trustProxy);

const corsOptions: cors.CorsOptions = {
  origin: config.cors.origin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  credentials: config.cors.credentials,
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(helmet());
// Response compression if available
if (compression) {
  app.use(compression());
}
// Lightweight request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path === '/api/healthz') return; // reduce noise
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
  });
  next();
});
// Global API rate limit (disabled in development)
if (config.env !== 'development') {
  const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'too_many_requests' },
  });
  app.use('/api', apiLimiter);
}
// Begränsa body-storlek (basic skydd) och använd JSON parser
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeTextInputs);

app.get("/api/healthz", (_req, res) => {
  res.json({ 
    ok: true, 
    uptime: process.uptime(), 
    version: pkg.version,
    message: 'Backend is running and responding to requests'
  });
});



const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeout,
});

// Initiera AuditLogger
initAuditLogger(pool);

// För utveckling/test: säkerställ att kritiska schema-tillägg finns (idempotent)
async function ensureSchema() {
  try {
    // Kolla om kolumnen customers.is_protected finns
    const check = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_protected' LIMIT 1`
    );
    if (check.rowCount === 0) {
      console.log('🛠️  Skapar kolumn customers.is_protected (saknades) ...');
      await pool.query(
        `ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;`
      );
      await pool.query(
        `COMMENT ON COLUMN customers.is_protected IS 'True if customer has protected identity. Initials should be masked in API for unauthorized viewers.';`
      );
      console.log('✅ customers.is_protected skapad');
    }

    const groupCheck = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'is_group' LIMIT 1`
    );
    if (groupCheck.rowCount === 0) {
      console.log('🛠️  Skapar kolumn customers.is_group (saknades) ...');
      await pool.query(
        `ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE;`
      );
      console.log('✅ customers.is_group skapad');
    }

    await pool.query(`ALTER TABLE customers ALTER COLUMN gender DROP NOT NULL;`);
    await pool.query(`ALTER TABLE customers ALTER COLUMN birth_year DROP NOT NULL;`);

    // Normalisera insats-kategorier (ersätt Förebyggande enligt krav)
    try {
      const efforts = await pool.query(`SELECT id, name, available_for FROM efforts`);
      for (const row of efforts.rows) {
        const normalized = normalizeAvailableFor(row.name, row.available_for || '');
        if (normalized !== row.available_for) {
          await pool.query(`UPDATE efforts SET available_for = $1 WHERE id = $2`, [normalized, row.id]);
        }
      }
    } catch (effortsError) {
      console.warn('⚠️  Kunde inte normalisera efforts.available_for:', (effortsError as any)?.message || effortsError);
    }
  } catch (err) {
    console.warn('⚠️  ensureSchema misslyckades (fortsätter ändå):', (err as any)?.message || err);
  }
}

// Kör schema-säkring i bakgrunden
ensureSchema();



// Viktigt: allt under /api
app.use("/api/customers", customers(pool));
app.use("/api/efforts", efforts(pool));
app.use("/api/handlers", handlers(pool));
app.use("/api/cases", cases(pool));
app.use("/api/stats", stats(pool));
app.use("/api/shifts", shifts(pool));
app.use("/api/users", users(pool));
app.use("/api/invites", invites(pool));
app.use("/api/audit", audit(pool));
app.use("/api/auth", auth(pool));

// Central error handler (keep last)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err?.message || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error' });
});

app.listen(config.port, () => {
  console.log(`🚀 API-servern kör på port ${config.port}`);
  console.log(`📡 API-prefix: /api/*`);
});
