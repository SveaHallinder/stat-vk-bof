import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import crypto from "crypto";

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

// Hämta alla kunder (med stöd för all=true)
app.get("/customers", async (req, res) => {
  try {
    let result;
    if (req.query.all === "true") {
      result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    } else {
      result = await pool.query("SELECT * FROM customers WHERE active = TRUE ORDER BY id ASC");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta kunder" });
  }
});

// Avaktivera kund
app.put("/customers/:id/deactivate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE customers SET active = FALSE WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kund hittades inte eller är redan avaktiverad" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte avaktivera kund" });
  }
});

// Återaktivera kund
app.put("/customers/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE customers SET active = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kund hittades inte eller är redan aktiv" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte återaktivera kund" });
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

// --- INSATSER (EFFORTS) ---

// Skapa insats
app.post("/efforts", async (req, res) => {
  const { name, available_for } = req.body;
  if (!name || !available_for) {
    return res.status(400).json({ error: "Alla fält krävs" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO efforts (name, available_for) VALUES ($1, $2) RETURNING *",
      [name, available_for]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte skapa insats" });
  }
});

// Hämta alla insatser (med stöd för all=true)
app.get("/efforts", async (req, res) => {
  try {
    let result;
    if (req.query.all === "true") {
      result = await pool.query("SELECT * FROM efforts ORDER BY id ASC");
    } else {
      result = await pool.query("SELECT * FROM efforts WHERE active = TRUE ORDER BY id ASC");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta insatser" });
  }
});

// Avaktivera insats
app.put("/efforts/:id/deactivate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE efforts SET active = FALSE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte avaktivera insats" });
  }
});

// Återaktivera insats
app.put("/efforts/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE efforts SET active = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte återaktivera insats" });
  }
});

// Uppdatera insats
app.put("/efforts/:id", async (req, res) => {
  const { id } = req.params;
  const { name, available_for } = req.body;
  if (!name || !available_for) {
    return res.status(400).json({ error: "Alla fält krävs" });
  }
  try {
    const result = await pool.query(
      "UPDATE efforts SET name = $1, available_for = $2 WHERE id = $3 RETURNING *",
      [name, available_for, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Insats hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte uppdatera insats" });
  }
});

// Radera insats
app.delete("/efforts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM efforts WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Insats hittades inte" });
    }
    res.json({ message: "Insats raderad", effort: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte radera insats" });
  }
});

// Hämta alla insatser för en viss kund
app.get("/customers/:id/efforts", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        efforts.id AS effort_id,
        efforts.name AS effort_name,
        MIN(cases.date) AS start_date,
        ARRAY_AGG(DISTINCT h) AS handlers
      FROM cases
      LEFT JOIN efforts ON cases.effort_id = efforts.id
      LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
      LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
      LEFT JOIN LATERAL (VALUES (h1.name), (h2.name)) AS hn(h) ON TRUE
      WHERE cases.customer_id = $1
        AND cases.active = TRUE
        AND efforts.active = TRUE
      GROUP BY efforts.id, efforts.name
      ORDER BY start_date ASC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta insatser för kund" });
  }
});

// Hämta alla ärenden för en viss kund och insats
app.get("/customers/:customerId/efforts/:effortId/cases", async (req, res) => {
  const { customerId, effortId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        cases.id,
        cases.date,
        cases.hours,
        cases.status,
        cases.handler1_id,
        cases.handler2_id,
        h1.name AS handler1_name,
        h2.name AS handler2_name
      FROM cases
      LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
      LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
      WHERE cases.customer_id = $1
        AND cases.effort_id = $2
        AND cases.active = TRUE
      ORDER BY cases.date DESC, cases.id DESC
    `, [customerId, effortId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta ärenden för kund och insats" });
  }
});

// --- BEHANDLARE (HANDLERS) ---

// Hämta alla behandlare (med stöd för all=true)
app.get("/handlers", async (req, res) => {
  try {
    let result;
    if (req.query.all === "true") {
      result = await pool.query("SELECT * FROM handlers ORDER BY id ASC");
    } else {
      result = await pool.query("SELECT * FROM handlers WHERE active = TRUE ORDER BY id ASC");
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta behandlare" });
  }
});

// Återaktivera behandlare
app.put("/handlers/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE handlers SET active = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte återaktivera behandlare" });
  }
});

// Avaktivera behandlare
app.put("/handlers/:id/deactivate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE handlers SET active = FALSE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte avaktivera behandlare" });
  }
});

// Skapa behandlare
app.post("/handlers", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Namn och mail krävs" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO handlers (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    const handler = result.rows[0];
    // Skapa token
    const token = crypto.randomBytes(32).toString("hex");
    // Spara inbjudan
    await pool.query(
      "INSERT INTO invites (handler_id, email, token) VALUES ($1, $2, $3)",
      [handler.id, email, token]
    );
    // Returnera handler + token
    res.status(201).json({ ...handler, inviteToken: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte skapa behandlare" });
  }
});

// Uppdatera behandlare
app.put("/handlers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Namn och mail krävs" });
  }
  try {
    const result = await pool.query(
      "UPDATE handlers SET name = $1, email = $2 WHERE id = $3 RETURNING *",
      [name, email, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Behandlare hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte uppdatera behandlare" });
  }
});

// Radera behandlare
app.delete("/handlers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM handlers WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Behandlare hittades inte" });
    }
    res.json({ message: "Behandlare raderad", handler: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte radera behandlare" });
  }
});

// --- ÄRENDEN (CASES) ---

// Hämta alla unika statusar för ärenden
app.get("/case-statuses", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT status FROM cases ORDER BY status ASC");
    const statuses = result.rows.map(r => r.status).filter(Boolean);
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta statusar" });
  }
});

// Skapa nytt ärende
app.post("/cases", async (req, res) => {
  const { customer_id, handler1_id, handler2_id, effort_id, date, hours, status } = req.body;
  if (!customer_id || !handler1_id || !effort_id || !date) {
    return res.status(400).json({ error: "Obligatoriska fält saknas" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO cases (customer_id, handler1_id, handler2_id, effort_id, date, hours, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customer_id, handler1_id, handler2_id || null, effort_id, date, hours, status || 'Utförd']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte skapa ärende" });
  }
});

// Hämta alla ärenden med namn (med stöd för all=true)
app.get("/cases", async (req, res) => {
  try {
    let result;
    if (req.query.all === "true") {
      result = await pool.query(`
        SELECT
          cases.*,
          customers.initials AS customer_name,
          h1.name AS handler1_name,
          h2.name AS handler2_name,
          efforts.name AS effort_name
        FROM cases
        LEFT JOIN customers ON cases.customer_id = customers.id
        LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
        LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
        LEFT JOIN efforts ON cases.effort_id = efforts.id
        ORDER BY cases.date DESC, cases.id DESC
      `);
    } else {
      result = await pool.query(`
        SELECT
          cases.*,
          customers.initials AS customer_name,
          h1.name AS handler1_name,
          h2.name AS handler2_name,
          efforts.name AS effort_name
        FROM cases
        LEFT JOIN customers ON cases.customer_id = customers.id
        LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
        LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
        LEFT JOIN efforts ON cases.effort_id = efforts.id
        WHERE cases.active = TRUE
        ORDER BY cases.date DESC, cases.id DESC
      `);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kunde inte hämta ärenden" });
  }
});

// Avaktivera ärende
app.put("/cases/:id/deactivate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE cases SET active = FALSE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte avaktivera ärende" });
  }
});

// Återaktivera ärende
app.put("/cases/:id/activate", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "UPDATE cases SET active = TRUE WHERE id = $1 RETURNING *",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte återaktivera ärende" });
  }
});

// Uppdatera ärende
app.put("/cases/:id", async (req, res) => {
  const { id } = req.params;
  const { customer_id, handler1_id, handler2_id, effort_id, date, hours, status } = req.body;
  if (!customer_id || !handler1_id || !effort_id || !date) {
    return res.status(400).json({ error: "Obligatoriska fält saknas" });
  }
  try {
    const result = await pool.query(
      `UPDATE cases SET customer_id = $1, handler1_id = $2, handler2_id = $3, effort_id = $4, date = $5, hours = $6, status = $7 WHERE id = $8 RETURNING *`,
      [customer_id, handler1_id, handler2_id || null, effort_id, date, hours, status || 'Utförd', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ärende hittades inte" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte uppdatera ärende" });
  }
});

// Radera ärende
app.delete("/cases/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM cases WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ärende hittades inte" });
    }
    res.json({ message: "Ärende raderat", case: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte radera ärende" });
  }
});

// Statistik: summeringar
app.get("/stats/summary", async (req, res) => {
  const { from, to, insats, gender, birthYear, handler, customer } = req.query;
  let where = "WHERE cases.active = TRUE";
  const params: any[] = [];
  if (from) {
    params.push(from);
    where += ` AND cases.date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND cases.date <= $${params.length}`;
  }
  if (insats && insats !== "alla") {
    params.push(insats);
    where += ` AND cases.effort_id = $${params.length}`;
  }
  if (gender) {
    const genders = String(gender).split(",");
    where += ` AND customers.gender = ANY($${params.length + 1})`;
    params.push(genders);
  }
  if (birthYear) {
    const years = String(birthYear).split(",").map(Number);
    where += ` AND customers.birth_year = ANY($${params.length + 1})`;
    params.push(years);
  }
  if (handler) {
    const handlers = String(handler).split(",").map(Number);
    where += ` AND (cases.handler1_id = ANY($${params.length + 1}) OR cases.handler2_id = ANY($${params.length + 1}))`;
    params.push(handlers);
  }
  if (customer) {
    const customers = String(customer).split(",").map(Number);
    where += ` AND cases.customer_id = ANY($${params.length + 1})`;
    params.push(customers);
  }
  try {
    // Antal besök
    const besokRes = await pool.query(`SELECT COUNT(*) FROM cases LEFT JOIN customers ON cases.customer_id = customers.id ${where}` , params);
    // Antal unika kunder
    const kunderRes = await pool.query(`SELECT COUNT(DISTINCT cases.customer_id) FROM cases LEFT JOIN customers ON cases.customer_id = customers.id ${where}` , params);
    // Genomsnittlig tid (här: timmar, byt till minuter om du vill)
    const tidRes = await pool.query(`SELECT AVG(hours) FROM cases LEFT JOIN customers ON cases.customer_id = customers.id ${where}` , params);
    // Avbokningsgrad (andel ärenden med status = 'Avbokad')
    const avbokRes = await pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'Avbokad') AS avbok, COUNT(*) AS total FROM cases LEFT JOIN customers ON cases.customer_id = customers.id ${where}` , params);
    const antal_besok = Number(besokRes.rows[0].count) || 0;
    const antal_kunder = Number(kunderRes.rows[0].count) || 0;
    const genomsnittlig_tid = Math.round(Number(tidRes.rows[0].avg) * 60) || 0; // minuter
    const avbokningar = Number(avbokRes.rows[0].avbok) || 0;
    const total = Number(avbokRes.rows[0].total) || 1;
    const avbokningsgrad = Math.round((avbokningar / total) * 100);
    res.json({
      antal_besok,
      antal_kunder,
      genomsnittlig_tid,
      avbokningsgrad
    });
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta statistik" });
  }
});

// Statistik: per insats
app.get("/stats/by-effort", async (req, res) => {
  const { from, to, insats, gender, birthYear, handler, customer } = req.query;
  let where = "WHERE cases.active = TRUE";
  const params: any[] = [];
  if (from) {
    params.push(from);
    where += ` AND cases.date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND cases.date <= $${params.length}`;
  }
  if (insats && insats !== "alla") {
    params.push(insats);
    where += ` AND cases.effort_id = $${params.length}`;
  }
  if (gender) {
    const genders = String(gender).split(",");
    where += ` AND customers.gender = ANY($${params.length + 1})`;
    params.push(genders);
  }
  if (birthYear) {
    const years = String(birthYear).split(",").map(Number);
    where += ` AND customers.birth_year = ANY($${params.length + 1})`;
    params.push(years);
  }
  if (handler) {
    const handlers = String(handler).split(",").map(Number);
    where += ` AND (cases.handler1_id = ANY($${params.length + 1}) OR cases.handler2_id = ANY($${params.length + 1}))`;
    params.push(handlers);
  }
  if (customer) {
    const customers = String(customer).split(",").map(Number);
    where += ` AND cases.customer_id = ANY($${params.length + 1})`;
    params.push(customers);
  }
  try {
    const result = await pool.query(
      `SELECT efforts.id AS effort_id, efforts.name AS effort_name,
        COUNT(cases.id) AS antal_besok,
        COUNT(DISTINCT cases.customer_id) AS antal_kunder
      FROM cases
      LEFT JOIN efforts ON cases.effort_id = efforts.id
      LEFT JOIN customers ON cases.customer_id = customers.id
      ${where}
      GROUP BY efforts.id, efforts.name
      ORDER BY efforts.name ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta statistik per insats" });
  }
});

// Statistik: per månad
app.get("/stats/by-month", async (req, res) => {
  const { from, to, insats } = req.query;
  let where = "WHERE cases.active = TRUE";
  const params = [];
  if (from) {
    params.push(from);
    where += ` AND cases.date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND cases.date <= $${params.length}`;
  }
  if (insats && insats !== "alla") {
    params.push(insats);
    where += ` AND cases.effort_id = $${params.length}`;
  }
  try {
    const result = await pool.query(
      `SELECT EXTRACT(YEAR FROM cases.date) AS year, EXTRACT(MONTH FROM cases.date) AS month,
        COUNT(cases.id) AS antal_besok,
        COUNT(DISTINCT cases.customer_id) AS antal_kunder
      FROM cases
      ${where}
      GROUP BY year, month
      ORDER BY year, month`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta statistik per månad" });
  }
});

// Statistik: per behandlare
app.get("/stats/by-handler", async (req, res) => {
  const { from, to, insats } = req.query;
  let where = "WHERE cases.active = TRUE";
  const params = [];
  if (from) {
    params.push(from);
    where += ` AND cases.date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND cases.date <= $${params.length}`;
  }
  if (insats && insats !== "alla") {
    params.push(insats);
    where += ` AND cases.effort_id = $${params.length}`;
  }
  try {
    const result = await pool.query(
      `SELECT h.id AS handler_id, h.name AS handler_name,
        COUNT(cases.id) AS antal_besok,
        COALESCE(SUM(cases.hours), 0) AS antal_timmar
      FROM cases
      LEFT JOIN handlers h ON cases.handler1_id = h.id
      ${where}
      GROUP BY h.id, h.name
      ORDER BY h.name ASC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Kunde inte hämta statistik per behandlare" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API-servern kör på port ${PORT}`);
});
