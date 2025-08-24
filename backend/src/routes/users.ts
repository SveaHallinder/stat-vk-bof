import { Router, Request, Response } from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authenticateToken } from "../middleware/auth";
import rateLimit from "express-rate-limit";

// Rate limiting för login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 5, // 5 försök per IP
  message: { error: 'För många inloggningsförsök. Försök igen om 15 minuter.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

      // Skapa JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          name: user.name,
          role: user.role || 'handler'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Returnera användardata och token
      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'handler'
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Internt serverfel' });
    }
  });

  // Registrera ny användare (endast för admin)
  router.post('/register', authenticateToken, async (req: Request, res: Response) => {
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
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

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

  // Logout (client-side hanteras, men vi kan lägga till blacklist här senare)
  router.post('/logout', authenticateToken, (req: Request, res: Response) => {
    res.json({ message: 'Utloggning lyckades' });
  });

  return router;
};

export default users;
