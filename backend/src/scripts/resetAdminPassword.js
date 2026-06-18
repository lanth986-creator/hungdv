import dotenv from 'dotenv';
import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error('ADMIN_PASSWORD is missing in backend/.env');
  process.exit(1);
}

const passwordHash = await hashPassword(password);

const { rowCount } = await pool.query(
  `UPDATE app_users
   SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
   WHERE username = $2`,
  [passwordHash, username],
);

await pool.end();

if (rowCount === 0) {
  console.error(`User ${username} was not found.`);
  process.exit(1);
}

console.log(`Password updated for ${username}.`);
