import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const files = [
  'about.html',
  'services.html',
  'ai-development-services.html',
  'ai-automation-services.html',
  'ai-consulting-services.html',
  'website-development.html',
  'ai-website-development.html',
  'restaurant-website-development.html',
  'custom-web-development.html',
  'web-application-development.html',
  'ecommerce-development.html',
  '3d-website-development.html',
  'case-studies.html',
  'contact.html',
  'blog.html',
  'index.html',
  'assets/js/main.js'
];

for (const file of files) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  writeFileSync(file, text.replaceAll('sales@veytronatech.com', 'veytronatech@gmail.com'));
}
