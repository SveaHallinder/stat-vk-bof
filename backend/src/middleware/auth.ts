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

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "unauthenticated" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "token_expired" });
    }
    return res.status(401).json({ error: "invalid_token" });
  }
}
