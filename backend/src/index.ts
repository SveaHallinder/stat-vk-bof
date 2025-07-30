import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

import customers from "./routes/customers";
import efforts from "./routes/efforts";
import handlers from "./routes/handlers";
import cases from "./routes/cases";
import stats from "./routes/stats";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(customers(pool));
app.use(efforts(pool));
app.use(handlers(pool));
app.use(cases(pool));
app.use(stats(pool));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API-servern kör på port ${PORT}`);
});

