import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { generateAlias } from "../utils/alias";
import { validateCaseData, sanitizeTextInputs } from "../middleware/validation";

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

    // Kontrollera att kunden är aktiv och om skyddad – begränsa skapande till admin
    try {
      let custRow: any;
      try {
        const cust = await pool.query('SELECT active, is_protected FROM customers WHERE id = $1', [Number(customer_id)]);
        custRow = cust.rows[0];
      } catch (err: any) {
        if (err?.code === '42703') {
          const cust = await pool.query('SELECT active FROM customers WHERE id = $1', [Number(customer_id)]);
          custRow = { ...cust.rows[0], is_protected: false };
        } else {
          throw err;
        }
      }
      if (!custRow || custRow.active === false) {
        return res.status(400).json({ error: 'Kunden är inaktiv eller saknas' });
      }
      if (custRow.is_protected && String(req.user?.role).toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Endast admin kan skapa ärenden för skyddad kund' });
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
  router.get("/", async (req, res) => {
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

      const sql = `
        SELECT
          cases.id,
          cases.customer_id,
          cases.effort_id,
          cases.handler1_id,
          cases.handler2_id,
          cases.active,
          cases.created_at,
          customers.initials AS customer_initials,
          customers.is_protected,
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

      let r;
      try {
        r = await pool.query(sql, params);
      } catch (err: any) {
        if (err?.code === '42703') {
          // Fallback: kolumnen is_protected saknas
          const sqlFallback = `
        SELECT
          cases.id,
          cases.customer_id,
          cases.effort_id,
          cases.handler1_id,
          cases.handler2_id,
          cases.active,
          cases.created_at,
          customers.initials AS customer_initials,
          customers.active  AS customer_active,
          efforts.name       AS effort_name,
          h1.name            AS handler1_name,
          h2.name            AS handler2_name
        FROM cases
        LEFT JOIN customers ON cases.customer_id = customers.id
        LEFT JOIN efforts ON cases.effort_id = efforts.id
        LEFT JOIN handlers h1 ON cases.handler1_id  = h1.id
        LEFT JOIN handlers h2 ON cases.handler2_id  = h2.id
        ${whereSql}
        ORDER BY cases.id DESC`;
          r = await pool.query(sqlFallback, params);
          // Markera alla som oskyddade i bearbetning nedan
          r.rows = r.rows.map((row: any) => ({ ...row, is_protected: false }));
        } else {
          throw err;
        }
      }

      const viewerId = req.user?.id || 0;
      const viewerRole = req.user?.role || '';

      let rows = r.rows.map((row: any) => {
        const isProtected = !!row.is_protected;
        let safeCustomerName = row.customer_initials as string;
        if (isProtected) {
          const assigned = row.handler1_id === viewerId || row.handler2_id === viewerId;
          if (String(viewerRole).toLowerCase() === 'admin' || assigned) {
            safeCustomerName = generateAlias(row.customer_id, viewerId);
          } else {
            safeCustomerName = 'Anonym kund';
          }
        }
        return {
          ...row,
          customer_name: safeCustomerName,
        };
      });

      // Dölj skyddade ärenden helt för icke-admin och icke-tilldelade
      const isAdmin = String(viewerRole).toLowerCase() === 'admin';
      if (!isAdmin) {
        rows = rows.filter((row: any) => !row.is_protected || row.handler1_id === viewerId || row.handler2_id === viewerId);
      }

      res.json(rows);
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
      // Kontrollera att kunden är aktiv och om skyddad – begränsa uppdateringar till admin
      let custRow: any;
      try {
        const cust = await pool.query('SELECT active, is_protected FROM customers WHERE id = $1', [Number(customer_id)]);
        custRow = cust.rows[0];
      } catch (err: any) {
        if (err?.code === '42703') {
          const cust = await pool.query('SELECT active FROM customers WHERE id = $1', [Number(customer_id)]);
          custRow = { ...cust.rows[0], is_protected: false };
        } else {
          throw err;
        }
      }
      if (!custRow || custRow.active === false) {
        return res.status(400).json({ error: 'Kunden är inaktiv eller saknas' });
      }
      if (custRow.is_protected && String(req.user?.role).toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Endast admin kan uppdatera ärenden för skyddad kund' });
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
