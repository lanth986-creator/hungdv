import { hashSessionToken } from '../models/AuthSession.js';
import { findUserBySessionTokenHash } from '../models/User.js';

export const AUTH_COOKIE_NAME = 'hungdv_session';

const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) {
        return [cookie, ''];
      }
      return [
        decodeURIComponent(cookie.slice(0, separatorIndex)),
        decodeURIComponent(cookie.slice(separatorIndex + 1)),
      ];
    }),
);

export const getSessionToken = (req) => parseCookies(req.headers.cookie)[AUTH_COOKIE_NAME];

export const requireAuth = async (req, res, next) => {
  try {
    const token = getSessionToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Vui long dang nhap' });
    }

    const user = await findUserBySessionTokenHash(hashSessionToken(token));
    if (!user) {
      return res.status(401).json({ error: 'Phien dang nhap khong hop le hoac da het han' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const buildSessionCookie = (token, maxAgeMs) => {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];

  if (process.env.COOKIE_SECURE === 'true') {
    parts.push('Secure');
  }

  return parts.join('; ');
};

export const buildClearSessionCookie = () => [
  `${AUTH_COOKIE_NAME}=`,
  'HttpOnly',
  'Path=/',
  'SameSite=Lax',
  'Max-Age=0',
].join('; ');
