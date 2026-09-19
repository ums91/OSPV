import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, resolve, posix } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(process.cwd());
const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (['.git', 'node_modules'].includes(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
const rel = file => relative(ROOT, file).replaceAll('\\', '/');
const exists = p => {
  try { return statSync(p).isFile() || statSync(p).isDirectory(); }
  catch { return false; }
};

function stripUrl(value) {
  return value.trim().replace(/^['"]|['"]$/g, '').split('#')[0].split('?')[0];
}

function resolveLocalRef(sourceFile, value) {
  const clean = stripUrl(value);
  if (!clean) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/i.test(clean)) return null;
  // GitHub Pages project-site root: /OSPV/... maps to repository root.
  let target;
  if (clean.startsWith('/OSPV/')) target = join(ROOT, clean.slice('/OSPV/'.length));
  else if (clean.startsWith('/')) target = join(ROOT, clean.slice(1));
  else target = resolve(join(ROOT, relative(ROOT, sourceFile), '..'), clean);
  return target;
}

function checkRef(sourceFile, value, kind) {
  const target = resolveLocalRef(sourceFile, value);
  if (!target) return;
  if (!exists(target)) {
    errors.push(`${rel(sourceFile)}: broken ${kind} reference -> ${value}`);
  }
}

// 1) Parse every JSON file.
for (const file of files.filter(f => extname(f).toLowerCase() === '.json')) {
  try { JSON.parse(readFileSync(file, 'utf8')); }
  catch (err) { errors.push(`${rel(file)}: invalid JSON (${err.message})`); }
}

// 2) Syntax-check every JavaScript file with Node, without executing it.
for (const file of files.filter(f => extname(f).toLowerCase() === '.js')) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`${rel(file)}: JavaScript syntax error\n${(result.stderr || result.stdout).trim()}`);
  }
}

// 3) Check local HTML href/src references.
const htmlFiles = files.filter(f => extname(f).toLowerCase() === '.html');
const attrRe = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const text = readFileSync(file, 'utf8');
  let match;
  while ((match = attrRe.exec(text))) checkRef(file, match[1], 'HTML');
}

// 4) Check local CSS url(...) references.
const cssFiles = files.filter(f => extname(f).toLowerCase() === '.css');
const cssUrlRe = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*))\s*\)/gi;
for (const file of cssFiles) {
  const text = readFileSync(file, 'utf8');
  let match;
  while ((match = cssUrlRe.exec(text))) {
    const value = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    checkRef(file, value, 'CSS');
  }
}

// 5) Validate the catalogue/page relationship.
const cataloguePath = join(ROOT, 'assets', 'products.json');
if (exists(cataloguePath)) {
  try {
    const products = JSON.parse(readFileSync(cataloguePath, 'utf8'));
    if (!Array.isArray(products)) errors.push('assets/products.json: expected an array');
    else {
      const ids = products.map(p => p?.id).filter(Boolean);
      const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (duplicates.length) errors.push(`assets/products.json: duplicate product IDs: ${[...new Set(duplicates)].join(', ')}`);

      const photoIds = new Set(htmlFiles
        .filter(f => rel(f).startsWith('photos/'))
        .map(f => f.split('/').pop().replace(/\.html$/i, '')));
      const productIds = new Set(ids);
      for (const id of productIds) if (!photoIds.has(id)) errors.push(`Catalogue product has no photo page: ${id}`);
      for (const id of photoIds) if (!productIds.has(id)) errors.push(`Photo page has no catalogue product: ${id}`);
    }
  } catch { /* JSON validation above reports the parse failure. */ }
}

// 6) Basic repository hygiene warnings (non-blocking).
if (!exists(join(ROOT, 'sitemap.xml'))) warnings.push('sitemap.xml is missing');
if (!exists(join(ROOT, 'robots.txt'))) warnings.push('robots.txt is missing');

if (warnings.length) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`  ⚠ ${warning}`);
}

if (errors.length) {
  console.error('\nValidation failed:');
  for (const error of errors) console.error(`  ✖ ${error}`);
  process.exit(1);
}

console.log(`Validation passed: ${files.length} files scanned; ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${files.filter(f => extname(f).toLowerCase() === '.js').length} JavaScript, and ${files.filter(f => extname(f).toLowerCase() === '.json').length} JSON files checked.`);
