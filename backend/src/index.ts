import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
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
import search from "./routes/search";
import { initAuditLogger } from "./utils/auditLogger";
import { config } from "./config";
import { normalizeAvailableFor } from "./utils/efforts";
import { globalLimiter } from "./middleware/rateLimit";

// Konfigurationen valideras automatiskt vid import av config

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const corsOptions: cors.CorsOptions = {
  origin: config.cors.origin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  credentials: config.cors.credentials,
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// Response compression if available
if (compression) {
  app.use(compression());
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api', globalLimiter);

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

// Self-healing schema check. All statements are idempotent (IF NOT EXISTS /
// IF EXISTS) so this is safe to run on every pod startup. Without this,
// staging environments where the migration scripts in repo root were never
// applied manually start up with a partial schema and every login returns
// 500 from inside the SELECT.
async function ensureSchema() {
  try {
    // --- handlers (login depends on this — must come first) ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS handlers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'handler',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        refresh_token TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`ALTER TABLE handlers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;`);
    await pool.query(`ALTER TABLE handlers ADD COLUMN IF NOT EXISTS refresh_token TEXT;`);
    await pool.query(`ALTER TABLE handlers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`);
    await pool.query(`ALTER TABLE handlers ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'handler';`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_handlers_email ON handlers(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_handlers_active ON handlers(active);`);

    // --- customers ---
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

    // These two ALTER statements only succeed if customers exists. Guard so a
    // brand-new staging DB with no customers table doesn't blow up the whole
    // ensureSchema call (and thus all later steps).
    try {
      await pool.query(`ALTER TABLE customers ALTER COLUMN gender DROP NOT NULL;`);
      await pool.query(`ALTER TABLE customers ALTER COLUMN birth_year DROP NOT NULL;`);
    } catch (customersError) {
      console.warn('⚠️  customers ALTER misslyckades (kanske ny DB utan tabellen ännu):', (customersError as any)?.message || customersError);
    }

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

    console.log('✅ ensureSchema klar');
  } catch (err: any) {
    console.warn('⚠️  ensureSchema misslyckades (fortsätter ändå):', {
      code: err?.code,
      detail: err?.detail,
      message: err?.message,
    });
  }
}

// Kör schema-säkring i alla miljöer (idempotent). Detta gör att staging/prod
// kan självläka efter att en migration glömts bort.
void ensureSchema();



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
app.use("/api/search", search(pool));

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
