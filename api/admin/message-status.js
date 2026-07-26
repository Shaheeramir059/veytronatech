const { ensureSchema, getDb } = require('../../lib/db');
const { isAuthenticated } = require('../../lib/auth');
const { badRequest, methodNotAllowed, serverError } = require('../../lib/http');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!isAuthenticated(request)) return response.status(401).json({ error: 'Authentication required.' });
  const id = Number(request.body?.id);
  const action = request.body?.action;
  if (!Number.isSafeInteger(id) || id < 1 || !['read', 'unread', 'delete'].includes(action)) return badRequest(response, 'Invalid message action.');
  try {
    await ensureSchema();
    if (action === 'delete') await getDb()`DELETE FROM contact_messages WHERE id = ${id}`;
    else await getDb()`UPDATE contact_messages SET status = ${action} WHERE id = ${id}`;
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Updating message failed', error);
    return serverError(response);
  }
};
