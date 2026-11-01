import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { locationSchema } from '../schemas/placement.js';
import { HttpError, parseId, onUnique } from '../errors.js';
import { audit } from '../audit.js';

const router = Router();
router.use(authenticate, requirePermission('location:manage'));

router.get('/', (_req, res) => {
  res.json(db.prepare(`
    SELECT l.id, l.shelf, l.row, l.slot, p.name AS product
    FROM locations l
    LEFT JOIN product_locations pl ON pl.location_id = l.id
    LEFT JOIN products p ON p.id = pl.product_id
    ORDER BY l.shelf, l.row, l.slot`).all());
});

router.post('/', validate(locationSchema), (req, res) => {
  const { shelf, row, slot } = req.body;
  const id = onUnique(
    () => db.prepare('INSERT INTO locations (shelf, row, slot) VALUES (?, ?, ?)').run(shelf, row, slot).lastInsertRowid,
    'Šāda atrašanās vieta jau eksistē'
  );
  audit(req.user.id, 'location.create', 'location', id, `${shelf}-${row}-${slot}`);
  res.status(201).json({ id, shelf, row, slot });
});

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  if (!loc) throw new HttpError(404, 'Atrašanās vieta nav atrasta');
  if (db.prepare('SELECT 1 FROM product_locations WHERE location_id = ?').get(id)) {
    throw new HttpError(409, 'Vieta ir aizņemta ar preci');
  }
  db.prepare('DELETE FROM locations WHERE id = ?').run(id);
  audit(req.user.id, 'location.delete', 'location', id, `${loc.shelf}-${loc.row}-${loc.slot}`);
  res.json({ ok: true });
});

export default router;
