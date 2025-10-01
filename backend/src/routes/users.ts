import { Router, Request, Response } from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authenticateToken } from "../middleware/auth";
import { loginLimiter } from "../middleware/rateLimit";
import { validateUserRegistration, sanitizeTextInputs } from "../middleware/validation";

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

const users = (pool: Pool) => {
  const router = Router();



  // Login endpoint med rate limiting
  router.post('/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email och lösenord krävs' });
      }

      // Hämta användare från databas
      const result = await pool.query(
        'SELECT * FROM handlers WHERE email = $1 AND active = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
      }

      const user = result.rows[0];

      // Kontrollera lösenord med bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Ogiltiga inloggningsuppgifter' });
      }

      // Skapa JWT access token (kortare livslängd för säkerhet)
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role || 'handler',
          type: 'access'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' } // 15 minuter för access token
      );

      // Skapa refresh token (längre livslängd)
      const refreshToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          type: 'refresh'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' } // 7 dagar för refresh token
      );

      // Spara refresh token i databasen (för att kunna invalidera vid behov)
      await pool.query(
        'UPDATE handlers SET refresh_token = $1, last_login = NOW() WHERE id = $2',
        [refreshToken, user.id]
      );

      // Returnera användardata och tokens
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

    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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
        [decoded.id, refreshToken]
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
