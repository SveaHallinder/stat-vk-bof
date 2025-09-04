import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { getAuditLogger } from "../utils/auditLogger";
import { validateCustomerData, sanitizeTextInputs, validateSearchParams} from "../middleware/validation";

export default function customers(pool: Pool) {
  const router = Router();
  router.use(authenticateToken);

  // Skapa kund
  router.post("/", sanitizeTextInputs, validateCustomerData, async (req, res) => {
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
      
      // Logga skapandet av kund
      if (req.user) {
        const auditLogger = getAuditLogger(pool);
        await auditLogger.logCreate(
          req.user.id,
          req.user.name, // Använd name istället för username
          'customer',
          result.rows[0].id,
          `${initials} (${birthYear})`,
          { initials, gender, birthYear, startDate }
        );
      }
      
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Kunde inte skapa kund" });
    }
  });

  // Hämta alla kunder (med stöd för all=true)
  router.get("/", sanitizeTextInputs, validateSearchParams, async (req, res) => {
    try {
      let result;
      const page = req.query.page ? Math.max(1, parseInt(String(req.query.page))) : undefined;
      const limit = req.query.limit ? Math.min(1000, Math.max(1, parseInt(String(req.query.limit)))) : undefined;
      const usePaging = page && limit;
      const offset = usePaging ? (page! - 1) * limit! : 0;
      if (req.query.all === "true") {
        if (usePaging) {
          result = await pool.query("SELECT * FROM customers ORDER BY id ASC LIMIT $1 OFFSET $2", [limit, offset]);
        } else {
          result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
        }
      } else {
        if (usePaging) {
          result = await pool.query("SELECT * FROM customers WHERE active = TRUE ORDER BY id ASC LIMIT $1 OFFSET $2", [limit, offset]);
        } else {
          result = await pool.query("SELECT * FROM customers WHERE active = TRUE ORDER BY id ASC");
        }
      }
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta kunder" });
    }
  });

  // Avaktivera kund + anonymisera initialer permanent (GDPR)
  router.put("/:id/deactivate", sanitizeTextInputs, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE customers SET active = FALSE, initials = 'ANONYM' WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Kund hittades inte eller är redan avaktiverad" });
      }
      // Sätt alla kundens aktiva ärenden till inaktiva för att undvika inkonsekvens
      await pool.query(
        'UPDATE cases SET active = FALSE WHERE customer_id = $1 AND active = TRUE',
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte avaktivera kund" });
    }
  });

  // Återaktivera kund
  router.put("/:id/activate", sanitizeTextInputs, async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte återaktivera kund" });
    }
  });

  // Hämta en specifik kund
  router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Kund hittades inte" });
      }
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta kund" });
    }
  });

  // Uppdatera en kund
  router.put("/:id", sanitizeTextInputs, async (req, res) => {
    const { id } = req.params;
    const { initials, gender, birthYear, active, startDate } = req.body;
    if (!initials || !gender || !birthYear || typeof active !== "boolean") {
      return res.status(400).json({ error: "Alla fält krävs" });
    }
    try {
      // Hämta gamla värden för audit log
      const oldResult = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
      if (oldResult.rows.length === 0) {
        return res.status(404).json({ error: "Kund hittades inte" });
      }
      const oldValues = oldResult.rows[0];
      
      let result;
      const newInitials = active === false ? 'ANONYM' : initials;
      if (startDate) {
        result = await pool.query(
          "UPDATE customers SET initials = $1, gender = $2, birth_year = $3, active = $4, created_at = $5 WHERE id = $6 RETURNING *",
          [newInitials, gender, birthYear, active, startDate, id]
        );
      } else {
        result = await pool.query(
          "UPDATE customers SET initials = $1, gender = $2, birth_year = $3, active = $4 WHERE id = $5 RETURNING *",
          [newInitials, gender, birthYear, active, id]
        );
      }

      // Om kunden nu är inaktiv, stäng alla aktiva ärenden
      if (active === false) {
        await pool.query(
          'UPDATE cases SET active = FALSE WHERE customer_id = $1 AND active = TRUE',
          [id]
        );
      }
      
      // Logga uppdateringen
      if (req.user) {
        const auditLogger = getAuditLogger(pool);
        await auditLogger.logUpdate(
          req.user.id,
          req.user.name, // Använd name istället för username
          'customer',
          parseInt(id),
          `${initials} (${birthYear})`,
          oldValues,
          result.rows[0]
        );
      }
      
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte uppdatera kund" });
    }
  });

  // Ingen hårdradering av kunder — historik/statistik ska bevaras.

  // Hämta alla insatser för en viss kund
  router.get("/:id/efforts", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT
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
        ORDER BY start_date ASC`,
        [id]
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta insatser för kund" });
    }
  });

  // Hämta alla ärenden för en viss kund och insats
  router.get("/:customerId/efforts/:effortId/cases", async (req, res) => {
    const { customerId, effortId } = req.params;
    try {
      const result = await pool.query(
        `SELECT
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
        ORDER BY cases.id DESC`,
        [customerId, effortId]
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta ärenden för kund och insats" });
    }
  });

  return router;
}
