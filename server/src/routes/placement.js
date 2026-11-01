import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { placementSchema, conditionSchema } from '../schemas/placement.js';
import { HttpError, parseId } from '../errors.js';
import { PRODUCT_STATUS_LV } from '../labels.js';
import { audit } from '../audit.js';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('placement:read'), (_req, res) => {
  res.json(db.prepare(`
    SELECT p.id, p.sku, p.name, p.status, p.quantity,
           CASE WHEN l.id IS NULL THEN NULL ELSE l.shelf || '-' || l.row || '-' || l.slot END AS location,
           pl.updated_at
    FROM products p
    LEFT JOIN product_locations pl ON pl.product_id = p.id
    LEFT JOIN locations l ON l.id = pl.location_id
    ORDER BY p.name`).all());
});

router.get('/history', requirePermission('placement:read'), (_req, res) => {
  res.json(db.prepare(`
    SELECT a.id, a.timestamp, a.action, a.details, u.username AS user
    FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
    WHERE a.action LIKE 'placement.%' OR a.action = 'product.condition'
    ORDER BY a.id DESC LIMIT 100`).all());
});

// Register or move a product. A product has one location; the location is created if new.
router.post('/', requirePermission('placement:write'), validate(placementSchema), (req, res) => {
  const { product_id, shelf, row, slot } = req.body;
  const product = db.prepare('SELECT id, sku FROM products WHERE id = ?').get(product_id);
  if (!product) throw new HttpError(404, 'Prece nav atrasta');
  const label = `${shelf}-${row}-${slot}`;

  db.transaction(() => {
    db.prepare('INSERT OR IGNORE INTO locations (shelf, row, slot) VALUES (?, ?, ?)').run(shelf, row, slot);
    const loc = db.prepare('SELECT id FROM locations WHERE shelf = ? AND row = ? AND slot = ?').get(shelf, row, slot);
    const taken = db.prepare(`SELECT p.sku FROM product_locations pl JOIN products p ON p.id = pl.product_id
      WHERE pl.location_id = ? AND pl.product_id != ?`).get(loc.id, product_id);
    if (taken) throw new HttpError(409, `Vieta ${label} jau aizņemta (${taken.sku})`);
    const prev = db.prepare(`SELECT l.shelf || '-' || l.row || '-' || l.slot AS label FROM product_locations pl
      JOIN locations l ON l.id = pl.location_id WHERE pl.product_id = ?`).get(product_id);
    db.prepare('DELETE FROM product_locations WHERE product_id = ?').run(product_id);
    db.prepare('INSERT INTO product_locations (product_id, location_id, updated_by) VALUES (?, ?, ?)')
      .run(product_id, loc.id, req.user.id);
    audit(req.user.id, prev ? 'placement.move' : 'placement.set', 'product', product_id,
      `${product.sku}: ${prev ? prev.label + ' → ' : ''}${label}`);
  })();
  res.status(201).json({ ok: true, location: label });
});

router.delete('/:productId', requirePermission('placement:write'), (req, res) => {
  const id = parseId(req.params.productId);
  const product = db.prepare('SELECT sku FROM products WHERE id = ?').get(id);
  if (!product) throw new HttpError(404, 'Prece nav atrasta');
  const r = db.prepare('DELETE FROM product_locations WHERE product_id = ?').run(id);
  if (r.changes) audit(req.user.id, 'placement.remove', 'product', id, `${product.sku}: izvietojums noņemts`);
  res.json({ ok: true });
});

router.patch('/:productId/condition', requirePermission('placement:write'), validate(conditionSchema), (req, res) => {
  const id = parseId(req.params.productId);
  const product = db.prepare('SELECT sku, status FROM products WHERE id = ?').get(id);
  if (!product) throw new HttpError(404, 'Prece nav atrasta');
  db.prepare('UPDATE products SET status = ? WHERE id = ?').run(req.body.status, id);
  audit(req.user.id, 'product.condition', 'product', id,
    `${product.sku}: ${PRODUCT_STATUS_LV[product.status]} → ${PRODUCT_STATUS_LV[req.body.status]}`);
  res.json({ ok: true });
});

export default router;
