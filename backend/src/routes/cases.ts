import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { validateCaseData, sanitizeTextInputs, validateSearchParams } from "../middleware/validation";

export default function cases(pool: Pool) {
  const router = Router();
  router.use(authenticateToken);

  // Skapa nytt ärende
  router.post("/", sanitizeTextInputs, validateCaseData, async (req, res) => {
    const { customer_id, handler1_id, handler2_id, effort_id, active } = req.body;
    if (!customer_id || !handler1_id || !effort_id) {
      return res.status(400).json({ error: "Obligatoriska fält saknas" });
    }
    
    // Validera att värdena är giltiga nummer
    if (isNaN(Number(customer_id)) || isNaN(Number(handler1_id)) || isNaN(Number(effort_id))) {
      return res.status(400).json({ error: "Ogiltiga nummervärden" });
    }
    
    if (handler2_id && (isNaN(Number(handler2_id)) || Number(handler2_id) === 0)) {
      return res.status(400).json({ error: "Ogiltigt handler2_id värde" });
    }

    // Kontrollera att kunden är aktiv
    try {
      const cust = await pool.query('SELECT active FROM customers WHERE id = $1', [Number(customer_id)]);
      if (cust.rows.length === 0 || cust.rows[0].active === false) {
        return res.status(400).json({ error: 'Kunden är inaktiv eller saknas' });
      }
    } catch {}

    // Kontrollera om det redan finns ett aktivt ärende med samma kombination
    try {
      const existingCase = await pool.query(
        `SELECT id FROM cases 
         WHERE customer_id = $1 
         AND effort_id = $2 
         AND handler1_id = $3 
         AND (handler2_id = $4 OR (handler2_id IS NULL AND $4 IS NULL))
         AND active = TRUE`,
        [Number(customer_id), Number(effort_id), Number(handler1_id), handler2_id === "" || handler2_id === "0" || !handler2_id ? null : Number(handler2_id)]
      );

      if (existingCase.rows.length > 0) {
        return res.status(400).json({ 
          error: "Ett aktivt ärende med samma kombination finns redan för denna kund. Du kan inte skapa flera identiska ärenden." 
        });
      }
    } catch (checkError) {
      console.error("Error checking for duplicate case:", checkError);
      // Fortsätt med att skapa ärendet om kontrollen misslyckas
    }

    try {
      // Validera att insats och behandlare är aktiva
      const eff = await pool.query('SELECT active FROM efforts WHERE id = $1', [Number(effort_id)]);
      if (eff.rows.length === 0 || eff.rows[0].active === false) {
        return res.status(400).json({ error: 'Insatsen är inaktiv eller saknas' });
      }
      const h1 = await pool.query('SELECT active FROM handlers WHERE id = $1', [Number(handler1_id)]);
      if (h1.rows.length === 0 || h1.rows[0].active === false) {
        return res.status(400).json({ error: 'Behandlare 1 är inaktiv eller saknas' });
      }
      if (handler2_id) {
        const h2 = await pool.query('SELECT active FROM handlers WHERE id = $1', [Number(handler2_id)]);
        if (h2.rows.length === 0 || h2.rows[0].active === false) {
          return res.status(400).json({ error: 'Behandlare 2 är inaktiv eller saknas' });
        }
      }

      const r = await pool.query(
        `INSERT INTO cases (customer_id, handler1_id, handler2_id, effort_id, active)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [Number(customer_id), Number(handler1_id), handler2_id === "" || handler2_id === "0" || !handler2_id ? null : Number(handler2_id), Number(effort_id), active !== false]
      );
      res.status(201).json(r.rows[0]);
    } catch (e) {
      console.error("Error creating case:", e);
      res.status(500).json({ error: "Kunde inte skapa ärende" });
    }
  });

  // Hämta ärenden (med namn) + FILTER: all, customer_id, effort_id, active
  router.get("/", sanitizeTextInputs, validateSearchParams, async (req, res) => {
    try {
      const { all, customer_id, effort_id, active } = req.query as {
        all?: string; customer_id?: string; effort_id?: string; active?: string;
      };

      const where: string[] = [];
      const params: any[] = [];

      // default: visa bara aktiva om inte all=true
      if (all !== "true") where.push("cases.active = TRUE");

      if (typeof active === "string") {
        // active= true|false (överstyr default)
        where.push(`cases.active = $${params.length + 1}`);
        params.push(active === "true");
      }

      if (customer_id) {
        params.push(Number(customer_id));
        where.push(`cases.customer_id = $${params.length}`);
      }

      if (effort_id) {
        params.push(Number(effort_id));
        where.push(`cases.effort_id = $${params.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      let sql = `
        SELECT
          cases.id,
          cases.customer_id,
          cases.effort_id,
          cases.handler1_id,
          cases.handler2_id,
          cases.active,
          cases.created_at,
          customers.initials AS customer_name,
          customers.active  AS customer_active,
          efforts.name       AS effort_name,
          h1.name            AS handler1_name,
          h2.name            AS handler2_name
        FROM cases
        LEFT JOIN customers   ON cases.customer_id  = customers.id
        LEFT JOIN efforts     ON cases.effort_id    = efforts.id
        LEFT JOIN handlers h1 ON cases.handler1_id  = h1.id
        LEFT JOIN handlers h2 ON cases.handler2_id  = h2.id
        ${whereSql}
        ORDER BY cases.id DESC`;

      const page = (req.query as any).page ? Math.max(1, parseInt(String((req.query as any).page))) : undefined;
      const limit = (req.query as any).limit ? Math.min(1000, Math.max(1, parseInt(String((req.query as any).limit)))) : undefined;
      if (page && limit) {
        params.push(limit, (page - 1) * limit);
        sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
      }

      const r = await pool.query(sql, params);
      res.json(r.rows);
    } catch (e) {
      console.error("Error fetching cases:", e);
      res.status(500).json({ error: "Kunde inte hämta ärenden" });
    }
  });

  // Av/på-aktivera
  router.put("/:id/deactivate", sanitizeTextInputs, async (req, res) => {
    try {
      const r = await pool.query("UPDATE cases SET active = FALSE WHERE id = $1 RETURNING *", [req.params.id]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Ärende hittades inte" });
      res.json(r.rows[0]);
    } catch (e) {
      console.error("Error deactivating case:", e);
      res.status(500).json({ error: "Kunde inte avaktivera ärende" });
    }
  });

  router.put("/:id/activate", sanitizeTextInputs, async (req, res) => {
    try {
      const r = await pool.query("UPDATE cases SET active = TRUE WHERE id = $1 RETURNING *", [req.params.id]);
      if (r.rows.length === 0) return res.status(404).json({ error: "Ärende hittades inte" });
      res.json(r.rows[0]);
    } catch (e) {
      console.error("Error activating case:", e);
      res.status(500).json({ error: "Kunde inte återaktivera ärende" });
    }
  });

  // Uppdatera ärende
  router.put("/:id", sanitizeTextInputs, async (req, res) => {
    const { customer_id, handler1_id, handler2_id, effort_id, active } = req.body;
    if (!customer_id || !handler1_id || !effort_id) {
      return res.status(400).json({ error: "Obligatoriska fält saknas" });
    }
    
    // Validera att värdena är giltiga nummer
    if (isNaN(Number(customer_id)) || isNaN(Number(handler1_id)) || isNaN(Number(effort_id))) {
      return res.status(400).json({ error: "Ogiltiga nummervärden" });
    }
    
    if (handler2_id && (isNaN(Number(handler2_id)) || Number(handler2_id) === 0)) {
      return res.status(400).json({ error: "Ogiltigt handler2_id värde" });
    }

    // Kontrollera om det redan finns ett aktivt ärende med samma kombination (exkludera aktuellt ärende)
    try {
      const existingCase = await pool.query(
        `SELECT id FROM cases 
         WHERE customer_id = $1 
         AND effort_id = $2 
         AND handler1_id = $3 
         AND (handler2_id = $4 OR (handler2_id IS NULL AND $4 IS NULL))
         AND active = TRUE
         AND id != $5`,
        [Number(customer_id), Number(effort_id), Number(handler1_id), handler2_id === "" || handler2_id === "0" || !handler2_id ? null : Number(handler2_id), req.params.id]
      );

      if (existingCase.rows.length > 0) {
        return res.status(400).json({ 
          error: "Ett aktivt ärende med samma kombination finns redan för denna kund. Du kan inte skapa flera identiska ärenden." 
        });
      }
    } catch (checkError) {
      console.error("Error checking for duplicate case:", checkError);
      // Fortsätt med att uppdatera ärendet om kontrollen misslyckas
    }

    try {
      // Kontrollera att kunden är aktiv
      const cust = await pool.query('SELECT active FROM customers WHERE id = $1', [Number(customer_id)]);
      if (cust.rows.length === 0 || cust.rows[0].active === false) {
        return res.status(400).json({ error: 'Kunden är inaktiv eller saknas' });
      }

      // Validera att insats och behandlare är aktiva
      const eff = await pool.query('SELECT active FROM efforts WHERE id = $1', [Number(effort_id)]);
      if (eff.rows.length === 0 || eff.rows[0].active === false) {
        return res.status(400).json({ error: 'Insatsen är inaktiv eller saknas' });
      }
      const h1 = await pool.query('SELECT active FROM handlers WHERE id = $1', [Number(handler1_id)]);
      if (h1.rows.length === 0 || h1.rows[0].active === false) {
        return res.status(400).json({ error: 'Behandlare 1 är inaktiv eller saknas' });
      }
      if (handler2_id) {
        const h2 = await pool.query('SELECT active FROM handlers WHERE id = $1', [Number(handler2_id)]);
        if (h2.rows.length === 0 || h2.rows[0].active === false) {
          return res.status(400).json({ error: 'Behandlare 2 är inaktiv eller saknas' });
        }
      }

      const r = await pool.query(
        `UPDATE cases
           SET customer_id=$1, handler1_id=$2, handler2_id=$3, effort_id=$4, active=$5
         WHERE id=$6
         RETURNING *`,
        [
          Number(customer_id), 
          Number(handler1_id), 
          handler2_id === "" || handler2_id === "0" || !handler2_id ? null : Number(handler2_id), 
          Number(effort_id), 
          active !== false,
          req.params.id
        ]
      );
      if (r.rows.length === 0) return res.status(404).json({ error: "Ärende hittades inte" });
      res.json(r.rows[0]);
    } catch (e) {
      console.error("Error updating case:", e);
      res.status(500).json({ error: "Kunde inte uppdatera ärende" });
    }
  });

  // INGEN DELETE ENDPOINT - ärenden ska aldrig raderas, bara avslutas/aktiveras
  // Detta skyddar statistiken och historiken

  return router;
}
