import { Router } from "express";
import { Pool } from "pg";

export default function cases(pool: Pool) {
  const router = Router();

  // Hämta alla unika statusar för ärenden
  router.get("/case-statuses", async (_req, res) => {
    try {
      const result = await pool.query("SELECT DISTINCT status FROM cases ORDER BY status ASC");
      const statuses = result.rows.map(r => r.status).filter(Boolean);
      res.json(statuses);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta statusar" });
    }
  });

  // Skapa nytt ärende
  router.post("/cases", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte skapa ärende" });
    }
  });

  // Hämta alla ärenden med namn (med stöd för all=true)
  router.get("/cases", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte hämta ärenden" });
    }
  });

  // Avaktivera ärende
  router.put("/cases/:id/deactivate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE cases SET active = FALSE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte avaktivera ärende" });
    }
  });

  // Återaktivera ärende
  router.put("/cases/:id/activate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE cases SET active = TRUE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte återaktivera ärende" });
    }
  });

  // Uppdatera ärende
  router.put("/cases/:id", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte uppdatera ärende" });
    }
  });

  // Radera ärende
  router.delete("/cases/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM cases WHERE id = $1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Ärende hittades inte" });
      }
      res.json({ message: "Ärende raderat", case: result.rows[0] });
    } catch {
      res.status(500).json({ error: "Kunde inte radera ärende" });
    }
  });

  return router;
}

