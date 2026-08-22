const { listLeads } = require('../../lib/db');
const { isAuthenticated } = require('../../lib/auth');
const { methodNotAllowed, serverError } = require('../../lib/http');

module.exports = async (request, response) => {
  if (request.method !== 'GET') return methodNotAllowed(response, 'GET');
  if (!isAuthenticated(request)) return response.status(401).json({ error: 'Authentication required.' });
  try {
    const rows = await listLeads();
    const unread = rows.filter(row => row.status === 'unread').length;
    return response.status(200).json({ messages: rows, total: rows.length, unread });
  } catch (error) {
    console.error('Loading messages failed', error);
    return serverError(response);
  }
};
