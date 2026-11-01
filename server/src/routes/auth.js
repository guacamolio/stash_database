import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { PERMISSIONS, REPORT_ACCESS } from '../permissions.js';
import { authenticate, COOKIE_NAME } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Pārāk daudz mēģinājumu. Mēģiniet vēlāk.' },
});

// Compared against when the username doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

const findByUsername = db.prepare('SELECT * FROM users WHERE username = ?');

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  role: u.role,
  permissions: PERMISSIONS[u.role],
  reports: REPORT_ACCESS[u.role],
});

router.post('/login', loginLimiter, validate(loginSchema), (req, res) => {
  const { username, password } = req.body;
  const user = findByUsername.get(username);
  const ok = bcrypt.compareSync(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !ok) {
    return res.status(401).json({ error: 'Nepareizs lietotājvārds vai parole' });
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  });
  res.json(publicUser(user));
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => {
  res.json(publicUser(req.user));
});

export default router;
