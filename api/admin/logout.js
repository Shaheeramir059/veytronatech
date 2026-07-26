const { methodNotAllowed } = require('../../lib/http');
const { clearSessionCookie } = require('../../lib/auth');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  response.setHeader('Set-Cookie', clearSessionCookie());
  return response.status(200).json({ ok: true });
};
