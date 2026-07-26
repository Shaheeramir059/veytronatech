function methodNotAllowed(response, allowed) {
  response.setHeader('Allow', allowed);
  return response.status(405).json({ error: 'Method not allowed.' });
}

function badRequest(response, message) {
  return response.status(400).json({ error: message });
}

function serverError(response) {
  return response.status(500).json({ error: 'The service is temporarily unavailable. Please try again shortly.' });
}

module.exports = { badRequest, methodNotAllowed, serverError };
