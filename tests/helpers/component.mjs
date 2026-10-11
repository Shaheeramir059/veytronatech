import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
// Execute the actual TSX component in the CPU reconciler, without a browser,
// changing product source or installing another renderer/test package.
export async function loadComponent(filename) {
  const root = path.resolve(import.meta.dirname, '../..');
  let output = ts.transpileModule(fs.readFileSync(path.join(root, filename), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  output = output.replace(/from "([^"]+)"/g, (_, specifier) => {
    const url = specifier.startsWith('@/') ? pathToFileURL(path.join(root, 'src', specifier.slice(2) + '.ts')).href : import.meta.resolve(specifier);
    return `from ${JSON.stringify(url)}`;
  });
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}
