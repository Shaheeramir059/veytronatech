const { deleteLead, updateLeadStatus } = require('../../lib/db');
const { isAuthenticated } = require('../../lib/auth');
const { badRequest, methodNotAllowed, serverError } = require('../../lib/http');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!isAuthenticated(request)) return response.status(401).json({ error: 'Authentication required.' });
  const id = String(request.body?.id || '');
  const action = request.body?.action;
  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z#[0-9a-f-]{36}$/.test(id) || !['read', 'unread', 'delete'].includes(action)) return badRequest(response, 'Invalid message action.');
  try {
    if (action === 'delete') await deleteLead(id);
    else await updateLeadStatus(id, action);
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Updating message failed', error);
    return serverError(response);
  }
};
