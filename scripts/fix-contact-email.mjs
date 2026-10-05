import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const oldEmail = 'sales@veytronatech.com';
const newEmail = 'veytronatech@gmail.com';

const targets = [
  ...readdirSync(root).filter(name => name.endsWith('.html')).map(name => resolve(root, name)),
  resolve(root, 'assets/js/main.js')
];

for (const file of targets) {
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const updated = original.replaceAll(oldEmail, newEmail);
  if (updated !== original) writeFileSync(file, updated);
}
