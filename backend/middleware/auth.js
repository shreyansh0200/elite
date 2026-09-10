import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const accessToken = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!accessToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not configured' });
    }

    const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Session is invalid or expired' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export const roles = (...allowed) => (req, res, next) => {
  if (allowed.includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    message: 'You are not allowed to perform this action',
  });
};
