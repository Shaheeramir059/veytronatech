const { ensureSchema, getDb } = require('../lib/db');
const { badRequest, methodNotAllowed, serverError } = require('../lib/http');

const projectTypes = new Set(['AI Solution', 'Website', 'Web Application', 'E-Commerce', 'Automation', 'Other']);
const projectTypeAliases = new Map([
  ['E-Commerce Platform', 'E-Commerce'],
  ['Business Automation', 'Automation']
]);

module.exports = async (request, response) => {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  const { name = '', email = '', company = '', project_type: projectType = '', budget = '', message = '' } = request.body || {};
  const rawProjectType = String(projectType).trim();
  const values = {
    name: String(name).trim(),
    email: String(email).trim(),
    company: String(company).trim(),
    projectType: projectTypeAliases.get(rawProjectType) || rawProjectType,
    budget: String(budget).trim(),
    message: String(message).trim()
  };
  if (values.name.length < 2 || values.name.length > 100) return badRequest(response, 'Please enter a valid full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 254) return badRequest(response, 'Please enter a valid email address.');
  if (!projectTypes.has(values.projectType)) return badRequest(response, 'Please choose a project type.');
  if (values.company.length > 150 || values.budget.length > 100) return badRequest(response, 'One of your optional fields is too long.');
  if (values.message.length < 20 || values.message.length > 5000) return badRequest(response, 'Please describe your project in 20 to 5,000 characters.');
  try {
    await ensureSchema();
    await getDb()`INSERT INTO contact_messages (name, email, company, project_type, budget, message) VALUES (${values.name}, ${values.email}, ${values.company || null}, ${values.projectType}, ${values.budget || null}, ${values.message})`;
    return response.status(201).json({ message: 'Thank you — your message was received. We will review it and be in touch.' });
  } catch (error) {
    console.error('Contact submission failed', error);
    return serverError(response);
  }
};
