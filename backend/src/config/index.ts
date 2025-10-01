import dotenv from 'dotenv';
import path from 'path';

// Bestäm vilken miljö vi kör i
// Jest sätter JEST_WORKER_ID – använd det som robust indikator för test.
const IS_JEST = typeof process.env.JEST_WORKER_ID !== 'undefined';
const RAW_ENV = process.env.NODE_ENV || 'development';
const NODE_ENV = IS_JEST ? 'test' : RAW_ENV;
const IS_TEST = NODE_ENV === 'test';

// Ladda rätt .env-fil baserat på miljön
const envFile = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
dotenv.config({ path: envFile });

const toInt = (value: string | undefined, defaultValue: number): number => {
  const parsed = parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const TRUST_PROXY = ((process.env.TRUST_PROXY ?? 'true').toLowerCase() === 'true');

// Validera att alla kritiska variabler finns
function validateRequiredEnvVars() {
  // I testmiljö räcker det med JWT_SECRET; övriga kan mockas/inte användas
  const required = IS_TEST
    ? ['JWT_SECRET']
    : ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

  const missing: string[] = [];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(`❌ KRITISKT: Följande miljövariabler saknas: ${missing.join(', ')}\n   Kontrollera att filen .env.${NODE_ENV} finns och innehåller alla nödvändiga variabler.`);
  }

  // Validera JWT_SECRET
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('❌ KRITISKT: JWT_SECRET måste vara minst 32 tecken lång!');
  }

  // Validera DATABASE_URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.warn('⚠️  VARNING: DATABASE_URL bör använda postgresql:// istället för postgres:// för bättre kompatibilitet');
  }
}

// Konfigurationsobjekt
export const config = {
  // Miljö
  env: NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isStaging: NODE_ENV === 'staging',
  isProduction: NODE_ENV === 'production',

  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  trustProxy: TRUST_PROXY,

  // Database
  database: {
    url: process.env.DATABASE_URL!,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
      acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '60000', 10),
    }
  },

  // Security
  jwt: {
    secret: process.env.JWT_SECRET!,
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },

  // CORS
  cors: {
    // Hantera avsaknad av CORS_ORIGIN säkert (särskilt i test)
    origin: (process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
      : []),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Rate Limiting
  rateLimit: {
    redisUrl: process.env.REDIS_URL,
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    globalMax: toInt(process.env.RATE_LIMIT_GLOBAL_MAX ?? process.env.RATE_LIMIT_MAX_REQUESTS, 500),
    loginWindowMs: toInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
    loginMax: toInt(process.env.LOGIN_RATE_LIMIT_MAX, 20),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    auditEnabled: process.env.AUDIT_LOGGING_ENABLED === 'true',
  },

  // HTTPS
  https: {
    enabled: process.env.HTTPS_ENABLED === 'true',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },

  // Session
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10),
  },

  // Backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  },
};

// Validera konfigurationen vid import
validateRequiredEnvVars();

// Logga konfiguration (utan känslig information) endast i icke-produktionsmiljöer
if (!config.isProduction) {
  console.log(`🚀 Konfiguration laddad för miljö: ${config.env}`);
  console.log(`📡 Server kommer köra på port: ${config.port}`);
  console.log(`🔒 HTTPS: ${config.https.enabled ? 'AKTIVERAT' : 'INAKTIVERAT'}`);
  console.log(`🗄️  Database pool: ${config.database.pool.min}-${config.database.pool.max} connections`);
  console.log(`🌐 CORS origins: ${config.cors.origin.length} tillåtna`);
  console.log(`⚡ Rate limiting: ${config.rateLimit.globalMax} requests per ${config.rateLimit.windowMs / 1000 / 60} minuter`);
  const dbUrlLog = config.database.url
    ? config.database.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    : '(unset)';
  console.log(`🔗 Database URL: ${dbUrlLog}`);
} else {
  console.log('✅ Konfiguration laddad för produktionsmiljö');
}

export default config;
