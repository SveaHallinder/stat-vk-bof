import { Router } from "express";
import { Pool } from "pg";

export default function shifts(pool: Pool) {
  const router = Router();

  // Hämta alla shifts med relaterad information
  router.get("/shifts", async (_req, res) => {
    try {
      const result = await pool.query(
        `SELECT shifts.id, shifts.date, shifts.hours, shifts.status,
                customers.initials AS customer_name,
                efforts.name AS effort_name,
                h1.name AS handler1_name,
                h2.name AS handler2_name
         FROM shifts
         LEFT JOIN cases ON shifts.case_id = cases.id
         LEFT JOIN customers ON cases.customer_id = customers.id
         LEFT JOIN efforts ON cases.effort_id = efforts.id
         LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
         LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
         WHERE shifts.active = TRUE
         ORDER BY shifts.date DESC, shifts.id DESC`
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta shifts" });
    }
  });

  // Skapa ny shift och säkerställ att ett case finns
  router.post("/shifts", async (req, res) => {
    const { case_id, customer_id, effort_id, handler1_id, handler2_id, date, hours, status } = req.body;
    if ((!case_id && (!customer_id || !effort_id || !handler1_id)) || !date || hours === undefined) {
      return res.status(400).json({ error: "Obligatoriska fält saknas" });
    }
    try {
      let caseId: number = case_id;
      if (!caseId) {
        const existing = await pool.query(
          `SELECT id FROM cases WHERE customer_id = $1 AND effort_id = $2 AND handler1_id = $3 AND (handler2_id = $4 OR (handler2_id IS NULL AND $4 IS NULL)) LIMIT 1`,
          [customer_id, effort_id, handler1_id, handler2_id || null]
        );
        if (existing.rows.length > 0) {
          caseId = existing.rows[0].id;
        } else {
          const caseResult = await pool.query(
            `INSERT INTO cases (customer_id, effort_id, handler1_id, handler2_id, date, hours, status, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
             RETURNING id`,
            [customer_id, effort_id, handler1_id, handler2_id || null, date, hours, status || 'Utförd']
          );
          caseId = caseResult.rows[0].id;
        }
      }

      const result = await pool.query(
        `INSERT INTO shifts (case_id, date, hours, status, active)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING *`,
        [caseId, date, hours, status || 'Utförd']
      );
      res.status(201).json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte skapa shift" });
    }
  });

  return router;
}

