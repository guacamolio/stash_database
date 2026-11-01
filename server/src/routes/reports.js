import { Router } from 'express';
import { db } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { REPORT_ACCESS } from '../permissions.js';
import { HttpError } from '../errors.js';
import { PRODUCT_STATUS_LV, ORDER_STATUS_LV, LOW_STOCK } from '../labels.js';

const router = Router();
router.use(authenticate, requirePermission('report:read'));

const LOC = `CASE WHEN l.id IS NULL THEN '—' ELSE l.shelf || '-' || l.row || '-' || l.slot END`;

const REPORTS = {
  stock: {
    title: 'Krājumu atskaite',
    columns: [['sku', 'Artikuls'], ['name', 'Nosaukums'], ['quantity', 'Daudzums'], ['status', 'Stāvoklis'], ['location', 'Atrašanās vieta'], ['low', `Zems krājums (<${LOW_STOCK})`]],
    rows: () => db.prepare(`SELECT p.sku, p.name, p.quantity, p.status, ${LOC} AS location FROM products p
      LEFT JOIN product_locations pl ON pl.product_id = p.id LEFT JOIN locations l ON l.id = pl.location_id
      ORDER BY p.name`).all()
      .map((r) => ({ ...r, status: PRODUCT_STATUS_LV[r.status], low: r.quantity < LOW_STOCK ? 'Jā' : 'Nē' })),
  },
  orders: {
    title: 'Pasūtījumu atskaite',
    columns: [['id', 'Nr.'], ['status', 'Statuss'], ['created_by', 'Izveidoja'], ['created_at', 'Izveidots'], ['units', 'Vienības kopā']],
    rows: () => db.prepare(`SELECT o.id, o.status, u.username AS created_by, o.created_at, COALESCE(SUM(oi.quantity), 0) AS units
      FROM orders o LEFT JOIN users u ON u.id = o.created_by LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id ORDER BY o.id DESC`).all().map((r) => ({ ...r, status: ORDER_STATUS_LV[r.status] })),
  },
  placement: {
    title: 'Izvietojuma un stāvokļa atskaite',
    columns: [['sku', 'Artikuls'], ['name', 'Nosaukums'], ['location', 'Atrašanās vieta'], ['status', 'Stāvoklis'], ['updated_at', 'Atjaunināts'], ['updated_by', 'Atjaunināja']],
    rows: () => db.prepare(`SELECT p.sku, p.name, p.status, ${LOC} AS location, pl.updated_at, u.username AS updated_by
      FROM products p LEFT JOIN product_locations pl ON pl.product_id = p.id
      LEFT JOIN locations l ON l.id = pl.location_id LEFT JOIN users u ON u.id = pl.updated_by
      ORDER BY (l.id IS NULL) DESC, p.name`).all()
      .map((r) => ({ ...r, status: PRODUCT_STATUS_LV[r.status], updated_at: r.updated_at ?? '—', updated_by: r.updated_by ?? '—' })),
  },
  activity: {
    title: 'Darbību žurnāls',
    columns: [['timestamp', 'Laiks'], ['user', 'Lietotājs'], ['action', 'Darbība'], ['details', 'Detaļas']],
    rows: () => db.prepare(`SELECT a.timestamp, COALESCE(u.username, '(dzēsts)') AS user, a.action, COALESCE(a.details, '') AS details
      FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 500`).all(),
  },
};

// CSV cells starting with = + - @ can run as formulas in Excel, so prefix them with '
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

router.get('/:type', (req, res) => {
  const type = req.params.type;
  if (!REPORT_ACCESS[req.user.role].includes(type)) throw new HttpError(403, 'Nav piekļuves tiesību');
  const report = REPORTS[type];
  const rows = report.rows();

  if (req.query.format === 'csv') {
    const head = report.columns.map(([, label]) => cell(label)).join(',');
    const body = rows.map((r) => report.columns.map(([key]) => cell(r[key])).join(','));
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
    return res.send('\uFEFF' + [head, ...body].join('\r\n'));
  }
  res.json({ type, title: report.title, columns: report.columns.map(([key, label]) => ({ key, label })), rows });
});

export default router;
