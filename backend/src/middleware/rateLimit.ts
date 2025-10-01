import { Request, RequestHandler, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import config from '../config';

export const TOO_MANY_REQUESTS_RESPONSE = { error: 'too_many_requests' } as const;

export const rateLimitKeyGenerator = (req: Request, _res: Response) => ipKeyGenerator(req.ip ?? 'unknown');

const createLimiter = (windowMs: number, max: number): RequestHandler => {
  if (max <= 0) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitKeyGenerator,
    message: TOO_MANY_REQUESTS_RESPONSE,
  });
};

export const globalLimiter = createLimiter(config.rateLimit.windowMs, config.rateLimit.globalMax);
export const loginLimiter = createLimiter(config.rateLimit.loginWindowMs, config.rateLimit.loginMax);
