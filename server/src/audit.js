import { db } from './db.js';

const insert = db.prepare(
  'INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)'
);

export const audit = (userId, action, entity, entityId = null, details = null) =>
  insert.run(userId, action, entity, entityId, details);
