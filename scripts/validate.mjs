import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = file => readFile(resolve(root, file), 'utf8');
const fail = messages => { console.error(messages.map(message => `✗ ${message}`).join('\n')); process.exitCode = 1; };

const [index, projectsText, schemaText, llms, sitemap, headers] = await Promise.all([
  read('index.html'), read('content/projects.json'), read('schema/projects.schema.json'),
  read('llms.txt'), read('sitemap.xml'), read('_headers')
]);
const errors = [];
let projects;
try { projects = JSON.parse(projectsText); } catch (error) { errors.push(`content/projects.json is invalid JSON: ${error.message}`); }
try { JSON.parse(schemaText); } catch (error) { errors.push(`schema/projects.schema.json is invalid JSON: ${error.message}`); }

if (projects) {
  const ids = new Set();
  for (const project of projects.projects ?? []) {
    if (ids.has(project.id)) errors.push(`duplicate project id: ${project.id}`);
    ids.add(project.id);
    if (!/^https:\/\//.test(project.url)) errors.push(`project URL must use HTTPS: ${project.id}`);
    if (!index.includes(`data-project="${project.id}"`)) errors.push(`missing data-project in index.html: ${project.id}`);
    if (!index.includes(project.url)) errors.push(`missing project URL in index.html: ${project.id}`);
  }
  if ((projects.projects ?? []).length < 9) errors.push('expected at least 9 portfolio projects');
}
if (!/^#\s+.+/m.test(llms)) errors.push('llms.txt must contain an H1');
if (!/\[[^\]]+\]\(https:\/\/[^)]+\)/.test(llms)) errors.push('llms.txt must contain Markdown links');
if (!/<loc>https:\/\/eusheriff\.me\/<\/loc>/.test(sitemap)) errors.push('sitemap is missing the canonical URL');
if (!/Content-Security-Policy:/i.test(headers)) errors.push('_headers is missing CSP');
if (/-----BEGIN (RSA|OPENSSH|PRIVATE) KEY-----|sk-[A-Za-z0-9]{20,}/.test(index + projectsText + llms)) errors.push('possible secret detected');

if (errors.length) fail(errors);
else console.log(`✓ validated ${projects.projects.length} projects, sitemap, llms.txt, headers and secret scan`);
