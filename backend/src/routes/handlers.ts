import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import crypto from "crypto";

export default function handlers(pool: Pool) {
  const router = Router();
  
  // Public endpoint: Get a limited list of handlers (for all authenticated users)
  // This endpoint will return only ID and name, and will not require 'admin' role.
  router.get('/public', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, name FROM handlers ORDER BY name');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching public handlers list:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin-only endpoints
  router.use(authenticateToken, requireRole("admin"));

  // Hämta alla behandlare (med stöd för all=true)
  router.get("/", async (req, res) => {
    try {
      let result;
      if (req.query.all === "true") {
        result = await pool.query("SELECT * FROM handlers ORDER BY id ASC");
      } else {
        result = await pool.query("SELECT * FROM handlers WHERE active = TRUE ORDER BY id ASC");
      }
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta behandlare" });
    }
  });

  // Återaktivera behandlare
  router.put("/:id/activate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE handlers SET active = TRUE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte återaktivera behandlare" });
    }
  });

  // Avaktivera behandlare
  router.put("/:id/deactivate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE handlers SET active = FALSE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte avaktivera behandlare" });
    }
  });

  // Skapa behandlare - DENNA FUNKTION ÄR INAKTIVERAD
  // Behandlare skapas endast via invite-systemet för säkerhet
  router.post("/", async (req, res) => {
    res.status(403).json({ 
      error: "Behandlare kan inte skapas direkt. Använd invite-systemet istället.",
      message: "Gå till Admin > Behandlare och skapa en inbjudan."
    });
  });

  // Uppdatera behandlare
  router.put("/:id", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte uppdatera behandlare" });
    }
  });

  // Radera behandlare
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM handlers WHERE id = $1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Behandlare hittades inte" });
      }
      res.json({ message: "Behandlare raderad", handler: result.rows[0] });
    } catch {
      res.status(500).json({ error: "Kunde inte radera behandlare" });
    }
  });

  // Generera lösenordsåterställningslänk för behandlare
  router.post("/:id/generate-reset-link", async (req, res) => {
    try {
      const handlerId = parseInt(req.params.id);
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'validation_error',
          message: 'E-postadress krävs' 
        });
      }

      // Hitta behandlaren
      const handlerResult = await pool.query(
        'SELECT id, email, name FROM handlers WHERE id = $1 AND email = $2',
        [handlerId, email]
      );

      if (handlerResult.rows.length === 0) {
        return res.status(404).json({ 
          error: 'handler_not_found',
          message: 'Behandlare hittades inte' 
        });
      }

      const handler = handlerResult.rows[0];

      // Rensa gamla tokens för denna behandlare
      await pool.query(
        'DELETE FROM password_resets WHERE user_id = $1',
        [handlerId]
      );

      // Generera ny token och verifieringskod
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const verificationCode = Math.random().toString().slice(2, 10); // 8 siffror
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 timme

      // Spara i password_resets tabellen
      await pool.query(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [handlerId, hashedToken, expiresAt]
      );

      console.log(`✅ Admin genererade återställningslänk för behandlare: ${handler.email} (ID: ${handlerId})`);

      res.json({ 
        message: 'Återställningslänk genererad',
        token: token,
        verificationCode: verificationCode,
        handler: {
          id: handler.id,
          email: handler.email,
          name: handler.name
        }
      });

    } catch (error) {
      console.error('❌ Fel vid generering av återställningslänk:', error);
      res.status(500).json({ 
        error: 'internal_error',
        message: 'Ett internt fel uppstod' 
      });
    }
  });

  return router;
}

