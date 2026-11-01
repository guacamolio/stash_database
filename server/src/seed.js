import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const accounts = [
  { username: 'admin', role: 'admin' },
  { username: 'darbinieks', role: 'worker' },
  { username: 'kartotajs', role: 'sorter' },
];

const exists = db.prepare('SELECT 1 FROM users WHERE username = ?');
const insert = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');

for (const { username, role } of accounts) {
  if (exists.get(username)) {
    console.log(`- ${username} already exists, skipped`);
    continue;
  }
  const password = crypto.randomBytes(9).toString('base64url'); // 12 chars
  insert.run(username, bcrypt.hashSync(password, 12), role);
  console.log(`+ ${role.padEnd(6)} username: ${username}   password: ${password}`);
}
console.log('\nSave these passwords now: they are only shown once. To reset, delete server/stash.db and run seed again.');
