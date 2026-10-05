import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
async function files(path) {
  const entries = await readdir(path, {withFileTypes: true});
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(path, e.name)) : join(path,e.name)))).flat();
}
const missing = new Set();
for (const file of (await files('src')).filter(p => /\.(tsx?|css)$/.test(p))) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\/assets\/images\/[^\s'"`\)]+/g)) {
    try { await stat(join('public',match[0])); } catch { missing.add(`${file}: ${match[0]}`); }
  }
  if (content.includes('/src/assets/')) missing.add(`${file}: production source-asset path`);
}
if (missing.size) { console.error([...missing].join('\n')); process.exit(1); }
console.log('All referenced image assets exist in public/.');
