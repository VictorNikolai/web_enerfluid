/**
 * Genera src/styles/icons.css con SOLO los iconos de Remix Icon que usa la web.
 * Se ejecuta solo antes de `npm run dev` y `npm run build`.
 * Para añadir un icono: escribe su clase (ej. ri-home-line) en el HTML o JS.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const remixCss = readFileSync(require.resolve('remixicon/fonts/remixicon.css'), 'utf8');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sources = [join(root, 'index.html'), ...walk(join(root, 'src')).filter((f) => /\.(js|html|json)$/.test(f))];
const used = new Set();
for (const file of sources) {
  for (const match of readFileSync(file, 'utf8').matchAll(/\bri-[a-z0-9-]+\b/g)) used.add(match[0]);
}

const rules = [];
for (const name of [...used].sort()) {
  const rule = remixCss.match(new RegExp(`\\.${name}:before\\s*\\{[^}]*\\}`));
  if (rule) rules.push(rule[0]);
  else console.warn(`[icons] No existe el icono "${name}" en Remix Icon`);
}

const css = `/* Archivo generado por scripts/icons.mjs. No lo edites a mano. */
@font-face {
  font-family: 'remixicon';
  src: url('remixicon/fonts/remixicon.woff2') format('woff2');
  font-display: swap;
}
[class^='ri-'],
[class*=' ri-'] {
  font-family: 'remixicon' !important;
  font-style: normal;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
${rules.join('\n')}
`;

writeFileSync(join(root, 'src/styles/icons.css'), css);
console.log(`[icons] ${rules.length} iconos generados`);
