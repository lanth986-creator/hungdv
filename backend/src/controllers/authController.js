import { createSession, deleteSession } from '../models/AuthSession.js';
import { findActiveUserByUsername, validatePassword } from '../models/User.js';
import {
  buildClearSessionCookie,
  buildSessionCookie,
  getSessionToken,
} from '../middleware/auth.js';

const toSafeUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.display_name || user.username,
});

export const login = async (req, res, next) => {
  try {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui long nhap ten dang nhap va mat khau' });
    }

    const user = await findActiveUserByUsername(username);
    if (!user || !(await validatePassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Ten dang nhap hoac mat khau khong dung' });
    }

    const session = await createSession(user.id);
    res.setHeader('Set-Cookie', buildSessionCookie(session.token, session.maxAgeMs));

    return res.json({ user: toSafeUser(user) });
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await deleteSession(getSessionToken(req));
    res.setHeader('Set-Cookie', buildClearSessionCookie());
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

export const getCurrentUser = (req, res) => res.json({ user: toSafeUser(req.user) });
