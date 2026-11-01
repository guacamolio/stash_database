import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema, orderStatusSchema } from '../schemas/orders.js';
import { HttpError, parseId } from '../errors.js';
import { ORDER_TRANSITIONS } from '../labels.js';
import { audit } from '../audit.js';

const router = Router();
router.use(authenticate);

const LIST = `
  SELECT o.id, o.status, o.created_at, u.username AS created_by,
         COALESCE(SUM(oi.quantity), 0) AS units,
         GROUP_CONCAT(p.name || ' × ' || oi.quantity, ', ') AS items
  FROM orders o
  LEFT JOIN users u ON u.id = o.created_by
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products p ON p.id = oi.product_id`;

router.get('/', requirePermission('order:read'), (_req, res) => {
  res.json(db.prepare(`${LIST} GROUP BY o.id ORDER BY o.id DESC`).all());
});

router.post('/', requirePermission('order:create'), validate(orderSchema), (req, res) => {
  const create = db.transaction((userId, items) => {
    const orderId = db.prepare('INSERT INTO orders (created_by) VALUES (?)').run(userId).lastInsertRowid;
    for (const it of items) {
      const p = db.prepare('SELECT id, name, quantity, status FROM products WHERE id = ?').get(it.product_id);
      if (!p) throw new HttpError(400, `Prece ar ID ${it.product_id} nav atrasta`);
      if (p.status !== 'in_stock') throw new HttpError(409, `Prece "${p.name}" nav pieejama pasūtīšanai`);
      if (p.quantity < it.quantity) throw new HttpError(409, `Nepietiek krājumu: "${p.name}" (pieejams ${p.quantity})`);
      db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(it.quantity, p.id);
      db.prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)').run(orderId, p.id, it.quantity);
    }
    audit(userId, 'order.create', 'order', orderId, `${items.length} pozīcijas`);
    return orderId;
  });
  const id = create(req.user.id, req.body.items);
  res.status(201).json(db.prepare(`${LIST} WHERE o.id = ? GROUP BY o.id`).get(id));
});

router.patch('/:id/status', requirePermission('order:update_status'), validate(orderStatusSchema), (req, res) => {
  const id = parseId(req.params.id);
  const order = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(id);
  if (!order) throw new HttpError(404, 'Pasūtījums nav atrasts');
  const next = req.body.status;
  if (!ORDER_TRANSITIONS[order.status].includes(next)) {
    throw new HttpError(409, `Statusu nevar mainīt no "${order.status}" uz "${next}"`);
  }
  db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(next, id);
    if (next === 'cancelled') { // give the stock back
      db.prepare(`UPDATE products SET quantity = quantity +
        (SELECT quantity FROM order_items WHERE order_id = ? AND product_id = products.id)
        WHERE id IN (SELECT product_id FROM order_items WHERE order_id = ?)`).run(id, id);
    }
    audit(req.user.id, 'order.status', 'order', id, `${order.status} → ${next}`);
  })();
  res.json(db.prepare(`${LIST} WHERE o.id = ? GROUP BY o.id`).get(id));
});

export default router;
