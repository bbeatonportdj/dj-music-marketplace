import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'runmusic_jwt_secret_token_key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    display_name: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: unknown, decoded: unknown) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    if (decoded && typeof decoded === 'object') {
      const payload = decoded as Record<string, unknown>;
      req.user = {
        id: String(payload.id || ''),
        email: String(payload.email || ''),
        role: String(payload.role || ''),
        display_name: String(payload.display_name || ''),
      };
    }

    next();
  });
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
