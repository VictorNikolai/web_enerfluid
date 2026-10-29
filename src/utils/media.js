import sizes from '../data/image-sizes.json';
import { escapeHtml } from './format.js';

/*
 * Fotos generadas por `npm run images` en tres anchos y dos formatos:
 *   /img/carpeta/nombre-{480,960,1800}.{avif,webp}
 * En los archivos de datos se escribe solo la base: "/img/carpeta/nombre".
 */
export const WIDTHS = [480, 960, 1800];

export const src = (base, w = 960, ext = 'webp') => `${base}-${w}.${ext}`;

export const srcset = (base, ext = 'webp') => {
  const max = sizes[base]?.[0] ?? 1800;
  return WIDTHS.map((w) => `${base}-${w}.${ext} ${Math.min(w, max)}w`).join(', ');
};

/** Ancho y alto reales de la versión grande (para el visor con zoom). */
export const dimensions = (base) => sizes[base] ?? [1800, 1200];

/**
 * <picture> con AVIF (más liviano) y WebP de respaldo.
 * `attrs` se agrega tal cual al <img> (ej. 'loading="lazy"').
 */
export function picture(base, { alt = '', sizes: sizesAttr = '100vw', focus, attrs = 'loading="lazy"', w = 960 } = {}) {
  const style = focus ? ` style="object-position:${escapeHtml(focus)}"` : '';
  // Ancho y alto reales: el navegador reserva el espacio y la página no salta al cargar.
  const [width, height] = dimensions(base);
  return `<picture>
    <source type="image/avif" srcset="${srcset(base, 'avif')}" sizes="${sizesAttr}" />
    <img src="${src(base, w)}" srcset="${srcset(base)}" sizes="${sizesAttr}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" decoding="async" ${attrs}${style} />
  </picture>`;
}
