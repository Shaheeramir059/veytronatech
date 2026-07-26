const crypto = require('crypto');

const SESSION_MAX_AGE = 60 * 60 * 8;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(value).digest('base64url');
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
}

function sessionToken() {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured.');
  const payload = base64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }));
  return `${payload}.${sign(payload)}`;
}

function isAuthenticated(request) {
  if (!process.env.SESSION_SECRET) return false;
  const token = parseCookies(request).veytrona_admin;
  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).exp > Math.floor(Date.now() / 1000); } catch { return false; }
}

function passwordMatches(password) {
  const encoded = process.env.ADMIN_PASSWORD_HASH || '';
  const [scheme, salt, expected] = encoded.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) throw new Error('ADMIN_PASSWORD_HASH is not configured.');
  const received = crypto.scryptSync(password, salt, 64).toString('hex');
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

function sessionCookie(token) {
  return `veytrona_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

function clearSessionCookie() {
  return 'veytrona_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

module.exports = { clearSessionCookie, isAuthenticated, passwordMatches, sessionCookie, sessionToken };
