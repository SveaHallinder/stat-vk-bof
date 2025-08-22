import { Request, Response, NextFunction } from "express";

interface Options {
  windowMs: number;
  max: number;
}

const hits: Record<string, { count: number; firstHit: number }> = {};

export default function rateLimit({ windowMs, max }: Options) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip as string;
    const now = Date.now();
    const entry = hits[ip];
    if (!entry || now - entry.firstHit > windowMs) {
      hits[ip] = { count: 1, firstHit: now };
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.firstHit + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}
