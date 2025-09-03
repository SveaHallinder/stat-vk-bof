import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { validateShiftData, sanitizeTextInputs } from "../middleware/validation";

export default function shifts(pool: Pool) {
  const router = Router();
  router.use(authenticateToken);

  // Hämta alla shifts med relaterad information och filter
  router.get("/", async (req, res) => {
    try {
      const { case_id, customer_id, effort_id, from, to } = req.query;
      
      let whereClause = "WHERE shifts.active = TRUE";
      const params: any[] = [];
      let paramIndex = 1;
      
      if (case_id) {
        whereClause += ` AND shifts.case_id = $${paramIndex}`;
        params.push(case_id);
        paramIndex++;
      }
      
      if (customer_id) {
        whereClause += ` AND cases.customer_id = $${paramIndex}`;
        params.push(customer_id);
        paramIndex++;
      }
      
      if (effort_id) {
        whereClause += ` AND cases.effort_id = $${paramIndex}`;
        params.push(effort_id);
        paramIndex++;
      }
      
      if (from) {
        whereClause += ` AND shifts.date >= $${paramIndex}`;
        params.push(from);
        paramIndex++;
      }
      
      if (to) {
        whereClause += ` AND shifts.date <= $${paramIndex}`;
        params.push(to);
        paramIndex++;
      }
      
      const result = await pool.query(
        `SELECT shifts.id, shifts.date, shifts.hours, shifts.status,
                cases.id AS case_id,
                customers.initials AS customer_name,
                customers.active AS customer_active,
                efforts.name AS effort_name,
                h1.name AS handler1_name,
                h2.name AS handler2_name
         FROM shifts
         LEFT JOIN cases ON shifts.case_id = cases.id
         LEFT JOIN customers ON cases.customer_id = customers.id
         LEFT JOIN efforts ON cases.effort_id = efforts.id
         LEFT JOIN handlers h1 ON cases.handler1_id = h1.id
         LEFT JOIN handlers h2 ON cases.handler2_id = h2.id
         ${whereClause}
         ORDER BY shifts.date DESC, shifts.id DESC`,
        params
      );
      
      // Konvertera datum till YYYY-MM-DD format för att undvika tidszonsproblem
      const rows = result.rows.map(row => ({
        ...row,
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
      }));
      
      res.json(rows);
    } catch (e) {
      console.error("Error fetching shifts:", e);
      res.status(500).json({ error: "Kunde inte hämta shifts" });
    }
  });

  // Skapa ny shift och säkerställ att ett case finns
  router.post("/", sanitizeTextInputs, validateShiftData, async (req, res) => {
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
            `INSERT INTO cases (customer_id, effort_id, handler1_id, handler2_id, active)
             VALUES ($1, $2, $3, $4, TRUE)
             RETURNING id`,
            [customer_id, effort_id, handler1_id, handler2_id || null]
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
    } catch (e) {
      console.error("Error creating shift:", e);
      res.status(500).json({ error: "Kunde inte skapa shift" });
    }
  });

  // Uppdatera befintlig shift
  router.put("/:id", sanitizeTextInputs, async (req, res) => {
    const { id } = req.params;
    const { date, hours, status } = req.body;
    
    if (!date || hours === undefined || hours <= 0) {
      return res.status(400).json({ error: "Obligatoriska fält saknas eller ogiltiga värden" });
    }
    
    try {
      const result = await pool.query(
        `UPDATE shifts 
         SET date = $1, hours = $2, status = $3 
         WHERE id = $4 AND active = TRUE 
         RETURNING *`,
        [date, hours, status, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Shift hittades inte" });
      }
      
      res.json(result.rows[0]);
    } catch (e) {
      console.error("Error updating shift:", e);
      res.status(500).json({ error: "Kunde inte uppdatera shift" });
    }
  });

  // Inaktivera shifts som tillhör ett specifikt case (soft delete - INGEN permanent radering!)
  router.put("/case/:caseId/deactivate", sanitizeTextInputs, async (req, res) => {
    const { caseId } = req.params;
    
    try {
      const result = await pool.query(
        `UPDATE shifts SET active = FALSE WHERE case_id = $1 AND active = TRUE`,
        [caseId]
      );
      
      res.json({ 
        message: `Inaktiverade ${result.rowCount} shifts för case ${caseId}`,
        deactivatedCount: result.rowCount 
      });
    } catch (e) {
      console.error("Error deactivating shifts for case:", e);
      res.status(500).json({ error: "Kunde inte inaktivera shifts för case" });
    }
  });

  return router;
}
