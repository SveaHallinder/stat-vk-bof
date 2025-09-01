import dotenv from 'dotenv';
import path from 'path';

// Bestäm vilken miljö vi kör i
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ladda rätt .env-fil baserat på miljön
const envFile = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
dotenv.config({ path: envFile });

// Validera att alla kritiska variabler finns
function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN'
  ];

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
  trustProxy: process.env.TRUST_PROXY === 'true',

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
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()).filter(Boolean) || [],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Rate Limiting
  rateLimit: {
    redisUrl: process.env.REDIS_URL,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000', 10),
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

// Logga konfiguration (utan känslig information)
console.log(`🚀 Konfiguration laddad för miljö: ${config.env}`);
console.log(`📡 Server kommer köra på port: ${config.port}`);
console.log(`🔒 HTTPS: ${config.https.enabled ? 'AKTIVERAT' : 'INAKTIVERAT'}`);
console.log(`🗄️  Database pool: ${config.database.pool.min}-${config.database.pool.max} connections`);
console.log(`🌐 CORS origins: ${config.cors.origin.length} tillåtna`);
console.log(`⚡ Rate limiting: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000 / 60} minuter`);
console.log(`🔗 Database URL: ${config.database.url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

export default config;
