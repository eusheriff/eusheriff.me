import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [index, projectsText] = await Promise.all([
  readFile(resolve(root, 'index.html'), 'utf8'),
  readFile(resolve(root, 'content/projects.json'), 'utf8')
]);
const projects = JSON.parse(projectsText).projects;
const assertions = [
  ['all project cards exist', projects.every(({ id }) => index.includes(`data-project="${id}"`))],
  ['all project cases have URLs or an explicit private state', projects.every(({ url }) => index.includes(url))],
  ['dialogs are named', [...index.matchAll(/role="dialog"[^>]*aria-labelledby="([^"]+)"/g)].length >= 5],
  ['closed dialogs are inert', (index.match(/class="modal-backdrop[^"]*"[^>]*aria-hidden="true"[^>]*inert/g) ?? []).length >= 5],
  ['analytics beacon is present', index.includes('static.cloudflareinsights.com/beacon.min.js')],
  ['no empty external anchors', !/<a\s+[^>]*href=""/.test(index)]
];
const failed = assertions.filter(([, ok]) => !ok);
if (failed.length) { console.error(failed.map(([name]) => `✗ ${name}`).join('\n')); process.exit(1); }
console.log(`✓ ${assertions.length} interaction and release invariants passed`);
