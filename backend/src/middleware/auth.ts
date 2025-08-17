import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Utöka Request interface för att inkludera user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token saknas' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Ogiltig token' });
    }
    req.user = user;
    next();
  });
};

// Middleware för att kontrollera om användaren har admin-roll
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autentisering krävs' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin-behörighet krävs' });
  }

  next();
};

// Middleware för att kontrollera om användaren har specifik roll
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentisering krävs' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Otillräcklig behörighet' });
    }

    next();
  };
};
