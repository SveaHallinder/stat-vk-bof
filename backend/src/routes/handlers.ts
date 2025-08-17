import { Router } from "express";
import { Pool } from "pg";
import crypto from "crypto";

export default function handlers(pool: Pool) {
  const router = Router();

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

  // Skapa behandlare
  router.post("/", async (req, res) => {
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
      const token = crypto.randomBytes(32).toString("hex");
      await pool.query(
        "INSERT INTO invites (handler_id, email, token) VALUES ($1, $2, $3)",
        [handler.id, email, token]
      );
      res.status(201).json({ ...handler, inviteToken: token });
    } catch {
      res.status(500).json({ error: "Kunde inte skapa behandlare" });
    }
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

  return router;
}

