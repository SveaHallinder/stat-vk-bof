import { Router } from "express";
import { Pool } from "pg";
import { authenticateToken } from "../middleware/auth";

export default function efforts(pool: Pool) {
  const router = Router();
  router.use(authenticateToken);

  // Skapa insats
  router.post("/", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte skapa insats" });
    }
  });

  // Hämta alla insatser (med stöd för all=true)
  router.get("/", async (req, res) => {
    try {
      let result;
      if (req.query.all === "true") {
        result = await pool.query("SELECT * FROM efforts ORDER BY id ASC");
      } else {
        result = await pool.query("SELECT * FROM efforts WHERE active = TRUE ORDER BY id ASC");
      }
      console.log("Efforts data:", result.rows);
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Kunde inte hämta insatser" });
    }
  });

  // Avaktivera insats
  router.put("/:id/deactivate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE efforts SET active = FALSE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte avaktivera insats" });
    }
  });

  // Återaktivera insats
  router.put("/:id/activate", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "UPDATE efforts SET active = TRUE WHERE id = $1 RETURNING *",
        [id]
      );
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Kunde inte återaktivera insats" });
    }
  });

  // Uppdatera insats
  router.put("/:id", async (req, res) => {
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
    } catch {
      res.status(500).json({ error: "Kunde inte uppdatera insats" });
    }
  });

  // Radera insats
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("DELETE FROM efforts WHERE id = $1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Insats hittades inte" });
      }
      res.json({ message: "Insats raderad", effort: result.rows[0] });
    } catch {
      res.status(500).json({ error: "Kunde inte radera insats" });
    }
  });

  // Debug: Kolla efforts-tabellen
  router.get("/debug", async (req, res) => {
    try {
      const result = await pool.query("SELECT id, name, available_for, active FROM efforts ORDER BY id ASC");
      console.log("DEBUG: Efforts table contents:", result.rows);
      res.json({ 
        message: "Efforts table contents", 
        data: result.rows,
        count: result.rows.length 
      });
    } catch (err) {
      console.error("DEBUG: Error querying efforts:", err);
      res.status(500).json({ error: "Kunde inte hämta efforts debug info" });
    }
  });

  return router;
}

