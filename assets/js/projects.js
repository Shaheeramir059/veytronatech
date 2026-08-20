document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-project-detail]');
  if (!root) return;
  const projects = {
    virsa: { category: 'AI Commerce', name: 'VIRSA', summary: 'An AI-powered e-commerce ecosystem combining intelligent discovery and practical shopping tools.', tech: ['AI', 'Computer Vision', 'OCR', 'FastAPI', 'React'], challenge: 'Bring multiple AI-enabled shopping experiences into one cohesive product direction.', solution: 'A modular ecosystem for AI search, virtual fitting, biometric checkout, skin analysis, and OCR-led shopping.' },
    'smartqueue-ai': { category: 'Computer Vision', name: 'SmartQueue-AI', summary: 'An AI-powered queue analysis system for understanding queue behaviour and supporting operations.', tech: ['Computer Vision', 'Deep Learning', 'Python'], challenge: 'Make busy physical queues easier to observe and reason about.', solution: 'A computer-vision workflow that models relevant queue behaviour for operational review.' },
    'educational-gpt': { category: 'Learning AI', name: 'Educational GPT', summary: 'An educational AI assistant built to support interactive learning and knowledge assistance.', tech: ['Python', 'NLP', 'Transformers'], challenge: 'Make learning support responsive while retaining a clear experience.', solution: 'An assistant concept designed for guided questions, explanations, and contextual learning help.' }
  };
  const project = projects[new URLSearchParams(location.search).get('project')] || projects.virsa;
  const siteUrl = 'https://veytronatech.vercel.app';
  const projectKey = new URLSearchParams(location.search).get('project') || 'virsa';
  document.title = `${project.name} Case Study | VeytronaTech`;
  const description = document.head.querySelector('meta[name="description"]');
  if (description) description.content = project.summary;
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `${siteUrl}/project?project=${encodeURIComponent(projectKey)}`;
  const structuredData = document.createElement('script');
  structuredData.type = 'application/ld+json';
  structuredData.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${project.name} Case Study`,
    description: project.summary,
    author: { '@type': 'Organization', name: 'VeytronaTech' },
    publisher: { '@type': 'Organization', name: 'VeytronaTech', url: siteUrl },
    mainEntityOfPage: `${siteUrl}/project?project=${encodeURIComponent(projectKey)}`
  });
  document.head.append(structuredData);
  root.querySelector('[data-project-category]').textContent = project.category;
  root.querySelector('[data-project-name]').textContent = project.name;
  root.querySelector('[data-project-summary]').textContent = project.summary;
  root.querySelector('[data-project-challenge]').textContent = project.challenge;
  root.querySelector('[data-project-solution]').textContent = project.solution;
  root.querySelector('[data-project-tech]').replaceChildren(...project.tech.map(value => { const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = value; return tag; }));
});
