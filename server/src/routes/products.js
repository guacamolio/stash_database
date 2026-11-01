import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productSchema } from '../schemas/products.js';
import { HttpError, parseId, onUnique } from '../errors.js';
import { audit } from '../audit.js';

const router = Router();
router.use(authenticate);

const SELECT = `
  SELECT p.id, p.sku, p.name, p.quantity, p.status, p.created_at,
         CASE WHEN l.id IS NULL THEN NULL ELSE l.shelf || '-' || l.row || '-' || l.slot END AS location
  FROM products p
  LEFT JOIN product_locations pl ON pl.product_id = p.id
  LEFT JOIN locations l ON l.id = pl.location_id`;

const getProduct = (id) => db.prepare(`${SELECT} WHERE p.id = ?`).get(id);

router.get('/', requirePermission('product:read'), (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  const rows = q
    ? db.prepare(`${SELECT} WHERE p.name LIKE ? OR p.sku LIKE ? ORDER BY p.name`).all(`%${q}%`, `%${q}%`)
    : db.prepare(`${SELECT} ORDER BY p.name`).all();
  res.json(rows);
});

router.get('/:id', requirePermission('product:read'), (req, res) => {
  const p = getProduct(parseId(req.params.id));
  if (!p) throw new HttpError(404, 'Prece nav atrasta');
  res.json(p);
});

router.post('/', requirePermission('product:create'), validate(productSchema), (req, res) => {
  const { sku, name, quantity, status } = req.body;
  const id = onUnique(
    () => db.prepare('INSERT INTO products (sku, name, quantity, status) VALUES (?, ?, ?, ?)')
      .run(sku, name, quantity, status).lastInsertRowid,
    'Artikuls jau eksistē'
  );
  audit(req.user.id, 'product.create', 'product', id, `${sku} – ${name} (${quantity})`);
  res.status(201).json(getProduct(id));
});

router.put('/:id', requirePermission('product:update'), validate(productSchema), (req, res) => {
  const id = parseId(req.params.id);
  const old = getProduct(id);
  if (!old) throw new HttpError(404, 'Prece nav atrasta');
  const { sku, name, quantity, status } = req.body;
  onUnique(
    () => db.prepare('UPDATE products SET sku = ?, name = ?, quantity = ?, status = ? WHERE id = ?')
      .run(sku, name, quantity, status, id),
    'Artikuls jau eksistē'
  );
  const changes = Object.entries({ sku, name, quantity, status })
    .filter(([k, v]) => old[k] !== v).map(([k, v]) => `${k}: ${old[k]} → ${v}`).join(', ');
  audit(req.user.id, 'product.update', 'product', id, `${old.sku}: ${changes || 'bez izmaiņām'}`);
  res.json(getProduct(id));
});

router.delete('/:id', requirePermission('product:delete'), (req, res) => {
  const id = parseId(req.params.id);
  const old = getProduct(id);
  if (!old) throw new HttpError(404, 'Prece nav atrasta');
  if (db.prepare('SELECT 1 FROM order_items WHERE product_id = ?').get(id)) {
    throw new HttpError(409, 'Preci nevar dzēst, jo tā ir pasūtījumos');
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  audit(req.user.id, 'product.delete', 'product', id, `${old.sku} – ${old.name}`);
  res.json({ ok: true });
});

export default router;
