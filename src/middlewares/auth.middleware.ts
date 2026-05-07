import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { requireJwtSecret } from '../config/auth';

function isJwtPayload(payload: string | JwtPayload): payload is JwtPayload {
  return typeof payload === 'object' && payload !== null;
}

function authenticateBearerToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  let jwtSecret: string;

  try {
    jwtSecret = requireJwtSecret();
  } catch (err) {
    next(err);
    return;
  }

  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.set('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'Bearer token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (!isJwtPayload(payload) || !payload.sub) {
      res.set('WWW-Authenticate', 'Bearer');
      res.status(401).json({ error: 'Invalid bearer token' });
      return;
    }

    res.locals.authUser = {
      id: Number(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };

    next();
  } catch (_err) {
    res.set('WWW-Authenticate', 'Bearer');
    res.status(401).json({ error: 'Invalid bearer token' });
  }
}

export default authenticateBearerToken;
