import pool from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const ensureDefaultAdmin = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM app_users');
  if (rows[0].total > 0) {
    return;
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await hashPassword(password);

  await pool.query(
    `INSERT INTO app_users (username, password_hash, display_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO NOTHING`,
    [username, passwordHash, 'Administrator'],
  );

  console.log(`Default admin user created: ${username}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log('Default admin password is admin123. Set ADMIN_PASSWORD in backend/.env for production use.');
  }
};

export const findActiveUserByUsername = async (username) => {
  const { rows } = await pool.query(
    `SELECT id, username, password_hash, display_name
     FROM app_users
     WHERE username = $1 AND is_active = true`,
    [username],
  );
  return rows[0] || null;
};

export const findUserBySessionTokenHash = async (tokenHash) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.display_name
     FROM auth_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND u.is_active = true`,
    [tokenHash],
  );
  return rows[0] || null;
};

export const validatePassword = (password, passwordHash) => verifyPassword(password, passwordHash);
