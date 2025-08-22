import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map(o => o.trim()).filter(Boolean);
const corsOptions: cors.CorsOptions = {
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: false,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(helmet());
app.use(express.json());

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), version: pkg.version });
});

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
app.use("/api/invites", invites(pool));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API-servern kör på port ${PORT}`);
  console.log(`📡 API-prefix: /api/*`);
});

