import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Skapa kund
app.post("/customers", async function (req, res) {
  const { initials, gender, birthYear, startDate } = req.body;
  if (!initials || !gender || !birthYear) {
    return res.status(400).json({ error: "Alla fält krävs" });
  }
  try {
    let result;
    if (startDate) {
      result = await pool.query(
        "INSERT INTO customers (initials, gender, birth_year, active, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [initials, gender, birthYear, true, startDate]
      );
    } else {
      result = await pool.query(
        "INSERT INTO customers (initials, gender, birth_year, active) VALUES ($1, $2, $3, $4) RETURNING *",
        [initials, gender, birthYear, true]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte skapa kund" });
  }
});

// Hämta alla kunder
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta kunder" });
  }
});

// Hämta en specifik kund
app.get("/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kund hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta kund" });
  }
});

// Uppdatera en kund
app.put("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const { initials, gender, birthYear, active, startDate } = req.body;
  if (!initials || !gender || !birthYear || typeof active !== "boolean") {
    return res.status(400).json({ error: "Alla fält krävs" });
  }
  try {
    let result;
    if (startDate) {
      result = await pool.query(
        "UPDATE customers SET initials = $1, gender = $2, birth_year = $3, active = $4, created_at = $5 WHERE id = $6 RETURNING *",
        [initials, gender, birthYear, active, startDate, id]
      );
    } else {
      result = await pool.query(
        "UPDATE customers SET initials = $1, gender = $2, birth_year = $3, active = $4 WHERE id = $5 RETURNING *",
        [initials, gender, birthYear, active, id]
      );
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kund hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte uppdatera kund" });
  }
});

// Radera en kund
app.delete("/customers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kund hittades inte" });
    }
    res.json({ message: "Kund raderad", customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte radera kund" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API-servern kör på port ${PORT}`);
});
