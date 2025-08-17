import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { Pool } from "pg";

import customers from "./routes/customers";
import efforts from "./routes/efforts";
import handlers from "./routes/handlers";
import cases from "./routes/cases";
import stats from "./routes/stats";
import shifts from "./routes/shifts";
import users from "./routes/users";

dotenv.config();

const app = express();

// CORS - robust dev-setup
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",      // valfritt, men bra när Vite byter port
  "http://127.0.0.1:5174",
]);

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // Tillåt Postman, curl, server-to-server (ingen origin header)
    if (!origin) return cb(null, true);
    return cb(null, allowedOrigins.has(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Hantera preflight requests
app.options("*", cors(corsOptions));

// Logging middleware för CORS
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(helmet());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Viktigt: allt under /api
app.use("/api/customers", customers(pool));
app.use("/api/efforts", efforts(pool));
app.use("/api/handlers", handlers(pool));
app.use("/api/cases", cases(pool));
app.use("/api/stats", stats(pool));
app.use("/api/shifts", shifts(pool));
app.use("/api/users", users(pool));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API-servern kör på port ${PORT}`);
  console.log(`🌐 CORS tillåter origins: ${Array.from(allowedOrigins).join(', ')}`);
  console.log(`📡 API-prefix: /api/*`);
});

