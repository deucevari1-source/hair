import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Lazy secret check — runs at first sign/verify, NOT at module load.
// This is important for `next build` which evaluates module top-level
// without runtime env vars being present (Docker compose envs are runtime-only).
let _cachedSecret = null;
function getJwtSecret() {
  if (_cachedSecret) return _cachedSecret;
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('JWT_SECRET env var is required and must be at least 32 chars long');
  }
  _cachedSecret = s;
  return s;
}

export const CLIENT_COOKIE_NAME = 'client_token';
export const CLIENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const ADMIN_COOKIE_NAME = 'admin_token';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Set secure cookies only when actually serving HTTPS.
// On test HTTP deployments, set INSECURE_COOKIES=1 in env to allow cookies over plain HTTP.
function shouldUseSecureCookies() {
  if (process.env.INSECURE_COOKIES === '1') return false;
  return process.env.NODE_ENV === 'production';
}

export function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function signClientToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '365d' });
}

export function verifyClientToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function clientCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    maxAge: CLIENT_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookies(),
    maxAge: 0,
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
