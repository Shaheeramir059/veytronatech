const { methodNotAllowed, badRequest, serverError } = require('../../lib/http');
const { passwordMatches, sessionCookie, sessionToken } = require('../../lib/auth');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  const password = String(request.body?.password || '');
  if (!password) return badRequest(response, 'Enter your password.');
  try {
    if (!passwordMatches(password)) return response.status(401).json({ error: 'Invalid password.' });
    response.setHeader('Set-Cookie', sessionCookie(sessionToken()));
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Admin login failed', error);
    return serverError(response);
  }
};
