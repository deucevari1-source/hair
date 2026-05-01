import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';

export const CLIENT_COOKIE_NAME = 'client_token';
export const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function signClientToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });
}

export function verifyClientToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function clientCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: CLIENT_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function normalizeName(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toLocaleUpperCase('ru-RU') + w.slice(1).toLocaleLowerCase('ru-RU') : w))
    .join(' ');
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Also check cookies
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/admin_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export function requireAuth(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
