import { Router, Request, Response } from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { authenticateToken } from "../middleware/auth";
import { loginLimiter } from "../middleware/rateLimit";
import { validateUserRegistration, sanitizeTextInputs } from "../middleware/validation";

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const isMissingActiveColumnError = (err: any): boolean => {
  return err?.code === '42703' && String(err?.message || '').includes('active');
};

const logLoginError = (message: string, data: Record<string, unknown>) => {
  console.error(`[users login] ${message}`, data);
};

const logLoginWarning = (message: string, data: Record<string, unknown>) => {
  console.warn(`[users login] ${message}`, data);
};

const users = (pool: Pool) => {
  const router = Router();



  // Login endpoint med rate limiting
  router.post('/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email och lösenord krävs' });
      }

      let user: any;
      try {
        let result;
        try {
          result = await pool.query(
            'SELECT * FROM handlers WHERE email = $1 AND active = true',
            [email]
          );
        } catch (err: any) {
          if (!isMissingActiveColumnError(err)) {
            throw err;
          }

          logLoginWarning('legacy handlers schema missing active column, retrying lookup without active filter', {
            code: err?.code,
            message: err?.message,
          });
          result = await pool.query(
            'SELECT * FROM handlers WHERE email = $1',
            [email]
          );
        }

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
        }
        user = result.rows[0];
        if (user.active === false) {
          return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
        }
      } catch (err: any) {
        logLoginError('user lookup failed', {
          code: err?.code,
          detail: err?.detail,
          constraint: err?.constraint,
          message: err?.message,
          stack: err?.stack,
        });
        return res.status(500).json({ error: 'Internt serverfel' });
      }

      if (typeof user.password_hash !== 'string' || user.password_hash.length === 0) {
        logLoginError('password_hash saknas eller är ogiltig', {
          id: user.id,
          email: user.email,
        });
        return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
      }

      let isValidPassword = false;
      try {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } catch (err: any) {
        logLoginError('bcrypt.compare failed', {
          message: err?.message,
          hashLen: user.password_hash.length,
          id: user.id,
        });
        return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
      }
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'handler',
          type: 'access'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: 'refresh'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Best-effort: ett kolumn-/constraint-fel här ska INTE blockera login.
      // (Resultatet är att refresh-flödet då inte fungerar för användaren förrän
      // schemat är fixat, men access token funkar i 15 min så hen kommer in.)
      try {
        await pool.query(
          'UPDATE handlers SET refresh_token = $1, last_login = NOW() WHERE id = $2',
          [hashRefreshToken(refreshToken), user.id]
        );
      } catch (err: any) {
        logLoginWarning('refresh_token persist failed', {
          code: err?.code,
          detail: err?.detail,
          constraint: err?.constraint,
          message: err?.message,
          id: user.id,
        });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'handler'
        },
        accessToken,
        refreshToken
      });

    } catch (error: any) {
      logLoginError('outer handler failed', {
        code: error?.code,
        detail: error?.detail,
        constraint: error?.constraint,
        message: error?.message,
        stack: error?.stack,
      });
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  // Registrera ny användare (endast för admin)
  router.post('/register', authenticateToken, sanitizeTextInputs, validateUserRegistration, async (req: Request, res: Response) => {
    try {
      // Kontrollera om användaren är admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Endast admin kan skapa nya användare' });
      }

      const { name, email, password, role = 'handler' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Namn, email och lösenord krävs' });
      }

      // Hasha lösenord med bcrypt
      const hashedPassword = await bcrypt.hash(password, ROUNDS);

      // Skapa användare
      const result = await pool.query(
        'INSERT INTO handlers (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, role',
        [name, email, hashedPassword, role]
      );

      const newUser = result.rows[0];

      res.status(201).json({
        message: 'Användare skapad',
        user: newUser
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  // Hämta användarinfo (för att verifiera token)
  router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role FROM handlers WHERE id = $1 AND active = true',
        [req.user?.id]
      );

      if (!req.user || result.rows.length === 0) {
        return res.status(404).json({ error: 'Användare hittades inte' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  // Refresh token endpoint
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token krävs' });
      }

      // Verifiera refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ error: 'Ogiltig token typ' });
      }

      // Kontrollera att token finns i databasen
      const result = await pool.query(
        'SELECT id, name, email, role FROM handlers WHERE id = $1 AND refresh_token = $2 AND active = true',
        [decoded.id, hashRefreshToken(refreshToken)]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Ogiltig refresh token' });
      }

      const user = result.rows[0];

      // Skapa ny access token
      const newAccessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role || 'handler',
          type: 'access'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      res.json({
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'handler'
        }
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Ogiltig refresh token' });
      }
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  // Logout (invalidera refresh token)
  router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
      // Ta bort refresh token från databasen
      await pool.query(
        'UPDATE handlers SET refresh_token = NULL WHERE id = $1',
        [req.user?.id]
      );
      
      res.json({ message: 'Utloggning lyckades' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  return router;
};

export default users;
