import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../schemas/users.js';
import { HttpError, parseId, onUnique } from '../errors.js';
import { audit } from '../audit.js';

const router = Router();
router.use(authenticate);

const adminCount = () => db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
const getUser = (id) => db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);

router.get('/', requirePermission('user:read'), (_req, res) => {
  res.json(db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id').all());
});

router.get('/:id', requirePermission('user:read'), (req, res) => {
  const user = getUser(parseId(req.params.id));
  if (!user) throw new HttpError(404, 'Lietotājs nav atrasts');
  res.json(user);
});

router.post('/', requirePermission('user:create'), validate(createUserSchema), (req, res) => {
  const { username, password, role } = req.body;
  const id = onUnique(
    () => db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, bcrypt.hashSync(password, 12), role).lastInsertRowid,
    'Lietotājvārds jau eksistē'
  );
  audit(req.user.id, 'user.create', 'user', id, `${username} (${role})`);
  res.status(201).json(getUser(id));
});

router.put('/:id', requirePermission('user:update'), validate(updateUserSchema), (req, res) => {
  const id = parseId(req.params.id);
  const target = getUser(id);
  if (!target) throw new HttpError(404, 'Lietotājs nav atrasts');
  const { username, role, password } = req.body;

  if (id === req.user.id && role !== target.role) throw new HttpError(409, 'Nevar mainīt savu lomu');
  if (target.role === 'admin' && role !== 'admin' && adminCount() <= 1) {
    throw new HttpError(409, 'Nevar mainīt pēdējā administratora lomu');
  }

  onUnique(() => {
    db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?').run(username, role, id);
    if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 12), id);
  }, 'Lietotājvārds jau eksistē');

  const changes = [
    target.username !== username && `vārds ${target.username} → ${username}`,
    target.role !== role && `loma ${target.role} → ${role}`,
    password && 'parole nomainīta',
  ].filter(Boolean).join(', ');
  audit(req.user.id, 'user.update', 'user', id, changes || 'bez izmaiņām');
  res.json(getUser(id));
});

router.delete('/:id', requirePermission('user:delete'), (req, res) => {
  const id = parseId(req.params.id);
  const target = getUser(id);
  if (!target) throw new HttpError(404, 'Lietotājs nav atrasts');
  if (id === req.user.id) throw new HttpError(409, 'Nevar dzēst savu kontu');
  if (target.role === 'admin' && adminCount() <= 1) throw new HttpError(409, 'Nevar dzēst pēdējo administratoru');

  db.transaction(() => {
    // keep orders/placements, just detach the deleted user
    db.prepare('UPDATE orders SET created_by = NULL WHERE created_by = ?').run(id);
    db.prepare('UPDATE product_locations SET updated_by = NULL WHERE updated_by = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  })();
  audit(req.user.id, 'user.delete', 'user', id, target.username);
  res.json({ ok: true });
});

export default router;
