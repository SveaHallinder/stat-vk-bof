import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import crypto from "crypto";
import morgan from "morgan";
import { Pool } from "pg";
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

// Konfigurationen valideras automatiskt vid import av config

const app = express();
app.set("trust proxy", config.trustProxy);
app.disable('x-powered-by');
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowed = config.cors.origin || [];
    // Utveckling: tillåt alla om ingen lista är satt
    if (config.isDevelopment && allowed.length === 0) {
      return callback(null, true);
    }
    // Tillåt requests utan Origin (t.ex. curl, server-2-server)
    if (!origin) {
      return callback(null, true);
    }
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  credentials: config.cors.credentials,
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Säkerhetsheaders (CSP aktiveras i prod), HSTS i prod
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  referrerPolicy: { policy: "no-referrer" },
}));
if (config.isProduction) {
  app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true })); // 180 dagar
}

// Komprimering
app.use(compression());

// Request ID för spårbarhet
app.use((req, res, next) => {
  const incoming = (req.headers['x-request-id'] as string) || undefined;
  const id = incoming || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeTextInputs);

app.get("/api/healthz", (_req, res) => {
  res.json({ 
    ok: true, 
    uptime: process.uptime(), 
    version: pkg.version,
    message: 'Backend is running and responding to requests'
  });
});

// Readiness med DB‑ping
app.get('/api/readyz', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});


const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeout,
});

// Initiera AuditLogger
initAuditLogger(pool);
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});



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

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: 'Endpoint not found' });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'internal_error', message: 'Internt serverfel' });
});

const server = app.listen(config.port, () => {
  console.log(`🚀 API-servern kör på port ${config.port}`);
  console.log(`📡 API-prefix: /api/*`);
});

// Graceful shutdown
function shutdown(signal: string) {
  console.log(`\nReceived ${signal}. Stänger ned...`);
  server.close(() => {
    pool.end()
      .then(() => {
        console.log('✔️  PostgreSQL pool stängd.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Fel vid stängning av pool:', err);
        process.exit(1);
      });
  });
  // Fallback timeout
  setTimeout(() => {
    console.warn('Tvingad nedstängning efter timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
