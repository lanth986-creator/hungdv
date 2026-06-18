import { createHash, randomBytes } from 'crypto';
import pool from '../config/database.js';

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 7);

export const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');

export const createSession = async (userId) => {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);

  await pool.query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3::text || ' days')::interval)`,
    [userId, tokenHash, SESSION_DAYS],
  );

  return { token, maxAgeMs: SESSION_DAYS * 24 * 60 * 60 * 1000 };
};

export const deleteSession = async (token) => {
  if (!token) {
    return;
  }

  await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [hashSessionToken(token)]);
};

export const deleteExpiredSessions = async () => {
  await pool.query('DELETE FROM auth_sessions WHERE expires_at <= NOW()');
};
