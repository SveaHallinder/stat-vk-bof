import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sanitizeTextInputs } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Hjälpfunktion för att hasha token (för säker lagring)
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default function authRoutes(pool: Pool) {
  const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);
  // Rate limiting för reset-flöden
  const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuter
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'För många försök. Försök igen senare.' },
  });
  // POST /api/auth/validate-reset-token
  router.post('/validate-reset-token', resetLimiter, sanitizeTextInputs, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          error: 'validation_error',
          message: 'Token krävs' 
        });
      }

      const hashedToken = hashToken(token);

      // Hitta token i databasen
      const result = await pool.query(
        `SELECT pr.*, h.email, h.name 
         FROM password_resets pr 
         JOIN handlers h ON pr.user_id = h.id 
         WHERE pr.token = $1 AND pr.expires_at > NOW() AND pr.used_at IS NULL`,
        [hashedToken]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ 
          error: 'invalid_token',
          message: 'Ogiltig eller utgången token' 
        });
      }

      const resetRequest = result.rows[0];
      res.json({ 
        message: 'Token är giltig',
        handler: {
          email: resetRequest.email,
          name: resetRequest.name
        }
      });

    } catch (error) {
      console.error('❌ Fel vid token-validering:', error);
      res.status(500).json({ 
        error: 'internal_error',
        message: 'Ett internt fel uppstod' 
      });
    }
  });

  // POST /api/auth/reset-password
  router.post('/reset-password', resetLimiter, sanitizeTextInputs, async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ 
          error: 'validation_error',
          message: 'Token och nytt lösenord krävs' 
        });
      }

      // Validera lösenord
      if (password.length < 8) {
        return res.status(400).json({ 
          error: 'validation_error',
          message: 'Lösenord måste vara minst 8 tecken' 
        });
      }

      // Kontrollera lösenordskrav
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return res.status(400).json({ 
          error: 'validation_error',
          message: 'Lösenord måste innehålla stor bokstav, liten bokstav, siffra och specialtecken' 
        });
      }

      const hashedToken = hashToken(token);

      // Hitta token i databasen
      const result = await pool.query(
        `SELECT pr.*, h.email, h.name 
         FROM password_resets pr 
         JOIN handlers h ON pr.user_id = h.id 
         WHERE pr.token = $1 AND pr.expires_at > NOW() AND pr.used_at IS NULL`,
        [hashedToken]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ 
          error: 'invalid_token',
          message: 'Ogiltig eller utgången token' 
        });
      }

      const resetRequest = result.rows[0];

      // Hasha det nya lösenordet
      const hashedPassword = await bcrypt.hash(password, ROUNDS);

      // Uppdatera behandlarens lösenord
      await pool.query(
        'UPDATE handlers SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, resetRequest.user_id]
      );

      // Markera token som använd
      await pool.query(
        'UPDATE password_resets SET used_at = NOW() WHERE id = $1',
        [resetRequest.id]
      );

      // Rensa alla andra tokens för denna behandlare
      await pool.query(
        'DELETE FROM password_resets WHERE user_id = $1 AND id != $2',
        [resetRequest.user_id, resetRequest.id]
      );

      res.json({ 
        message: 'Lösenord återställt framgångsrikt' 
      });

    } catch (error) {
      console.error('❌ Fel vid lösenordsåterställning:', error);
      res.status(500).json({ 
        error: 'internal_error',
        message: 'Ett internt fel uppstod' 
      });
    }
  });

  return router;
}
