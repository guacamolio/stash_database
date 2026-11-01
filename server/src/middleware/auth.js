import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { can } from '../permissions.js';

export const COOKIE_NAME = 'stash_token';

const getUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?');

// Verifies the cookie and loads the user from the DB on every request,
// so deleted users or changed roles take effect immediately.
export function authenticate(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Nav autentificēts' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = getUser.get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Nav autentificēts' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Nav autentificēts' });
  }
}

// Use after authenticate: router.get('/', authenticate, requirePermission('user:read'), ...)
export const requirePermission = (permission) => (req, res, next) => {
  if (!can(req.user.role, permission)) {
    return res.status(403).json({ error: 'Nav piekļuves tiesību' });
  }
  next();
};
