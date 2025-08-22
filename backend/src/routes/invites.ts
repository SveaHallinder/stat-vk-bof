import { Router } from "express";
import { Pool } from "pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import rateLimit from "../middleware/rateLimit";

export default function invites(pool: Pool) {
  const router = Router();

  router.post("/", authenticateToken, requireRole("admin"), async (req, res) => {
    const { handler_id, email } = req.body;
    if (!handler_id || !email) {
      return res.status(400).json({ error: "handler_id och email krävs" });
    }
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        "INSERT INTO invites (handler_id, email, token_hash, expires_at) VALUES ($1,$2,$3,$4)",
        [handler_id, email, tokenHash, expiresAt]
      );
      res.status(201).json({ token });
    } catch {
      res.status(500).json({ error: "Kunde inte skapa inbjudan" });
    }
  });

  router.post("/accept", rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
    const { token, password, name } = req.body;
    if (!token || !password || !name) {
      return res.status(400).json({ error: "token, password och name krävs" });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const r = await pool.query("SELECT * FROM invites WHERE token_hash=$1", [tokenHash]);
      if (r.rows.length === 0) {
        return res.status(400).json({ error: "Ogiltig token" });
      }
      const invite = r.rows[0];
      if (invite.used_at) {
        return res.status(400).json({ error: "Token redan använd" });
      }
      if (new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ error: "Token har gått ut" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE handlers SET name=$1, password_hash=$2 WHERE id=$3",
        [name, passwordHash, invite.handler_id]
      );
      await pool.query("UPDATE invites SET used_at = NOW() WHERE id=$1", [invite.id]);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Kunde inte acceptera inbjudan" });
    }
  });

  return router;
}
