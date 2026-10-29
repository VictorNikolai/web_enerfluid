/**
 * Genera las fotos de la web a partir de los originales.
 *
 *   media/originals/<carpeta>/<nombre>.jpg|png|webp
 *        ↓  npm run images
 *   public/img/<carpeta>/<nombre>-{480,960,1800}.avif y .webp
 *   src/data/image-sizes.json   (medidas, para el visor con zoom)
 *
 * Para agregar una foto: ponla en media/originals/mercado/ (o en la carpeta del
 * evento), ejecuta `npm run images` y úsala en los archivos de datos como
 * "/img/mercado/<nombre>". Solo se procesan las fotos nuevas o modificadas.
 * Usa `npm run images -- --force` para regenerar todo.
 */
import { mkdirSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'media/originals');
const OUT = join(root, 'public/img');
const WIDTHS = [480, 960, 1800];
const force = process.argv.includes('--force');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const originals = walk(SRC).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
const sizes = {};
let done = 0;

for (const file of originals) {
  const rel = relative(SRC, file);
  const folder = dirname(rel);
  const name = basename(rel, extname(rel));
  const key = `/img/${folder}/${name}`.replace(/\\/g, '/');
  const outDir = join(OUT, folder);
  mkdirSync(outDir, { recursive: true });

  const meta = await sharp(file).metadata();
  const largest = Math.min(WIDTHS.at(-1), meta.width);
  sizes[key] = [largest, Math.round((meta.height * largest) / meta.width)];

  const newest = statSync(file).mtimeMs;
  const target = join(outDir, `${name}-1800.avif`);
  if (!force && existsSync(target) && statSync(target).mtimeMs > newest) continue;

  for (const w of WIDTHS) {
    const base = sharp(file).rotate().resize({ width: w, withoutEnlargement: true });
    await base.clone().webp({ quality: w > 480 ? 80 : 70, effort: 5 }).toFile(join(outDir, `${name}-${w}.webp`));
    await base.clone().avif({ quality: w > 480 ? 55 : 48, effort: 4 }).toFile(join(outDir, `${name}-${w}.avif`));
  }
  done += 1;
  console.log(`[fotos] ${key}`);
}

writeFileSync(join(root, 'src/data/image-sizes.json'), `${JSON.stringify(sizes, null, 2)}\n`);
console.log(`[fotos] ${done} procesadas, ${originals.length - done} sin cambios`);
