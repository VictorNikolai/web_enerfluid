import data from '../data/mercado.json';
import { config } from '../config.js';
import { isPreview } from '../utils/env.js';
import { escapeHtml } from '../utils/format.js';
import { picture, src } from '../utils/media.js';
import { getLightbox } from './lightbox.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

/*
 * Brochure: se ve en la web (visor con zoom, página por página) y se descarga en PDF.
 * Las páginas están en public/img/brochure/ (npm run images) y el PDF en public/brochure/.
 */
export function initBrochure() {
  const { brochure } = data;
  const fileUrl = brochure.file;

  // Todos los enlaces de descarga de la web apuntan al mismo PDF.
  document.querySelectorAll('[data-brochure-download]').forEach((a) => {
    a.href = fileUrl;
    a.setAttribute('download', 'Brochure-Mercado-San-Martin.pdf');
  });
  document.querySelectorAll('[data-brochure-size]').forEach((s) => (s.textContent = brochure.size));
  if (isPreview) previewDownloads(fileUrl);

  const section = document.querySelector('[data-brochure]');
  if (!section) return;

  const absolute = new URL(fileUrl, config.site.url).href;
  const share = section.querySelector('[data-brochure-share]');
  share.href = `https://wa.me/?text=${encodeURIComponent(`Mira el brochure del Mercado San Martín (Huaycán): ${absolute}`)}`;

  const cover = section.querySelector('[data-brochure-cover]');
  const back = section.querySelector('[data-brochure-back]');
  cover.innerHTML = picture(brochure.pages[0].src, { alt: '', sizes: '(max-width: 860px) 86vw, 44vw' });
  back.innerHTML = picture(brochure.pages[1].src, { alt: '', sizes: '(max-width: 860px) 86vw, 44vw' });

  const strip = section.querySelector('[data-brochure-strip]');
  strip.innerHTML = `<ol class="brochure-pages">${brochure.pages
    .map(
      (p, i) => `<li><button type="button" class="brochure-page" data-brochure-open="${i}" data-cursor="Ver" aria-label="Ver página ${i + 1}: ${escapeHtml(p.caption)}">
        <img src="${src(p.src, 480)}" alt="" loading="lazy" decoding="async" width="480" height="339" />
        <span>${i + 1}</span>
      </button></li>`,
    )
    .join('')}</ol>`;

  const photos = brochure.pages.map((p, i) => ({ src: p.src, caption: `${i + 1} de ${brochure.pages.length} · ${p.caption}` }));
  const open = (start) => getLightbox().open({ title: 'Brochure Mercado San Martín', photos }, start);
  document.addEventListener('click', (event) => {
    const b = event.target.closest('[data-brochure-open]');
    if (b) open(Number(b.dataset.brochureOpen));
  });

  if (prefersReducedMotion) return;
  // La revista llega inclinada y se "abre" mientras se baja.
  const book = section.querySelector('.book');
  gsap.fromTo(
    book,
    { rotateY: -32, rotateX: 14, rotateZ: -4, y: 60 },
    {
      rotateY: -10,
      rotateX: 4,
      rotateZ: 0,
      y: 0,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'center center', scrub: 0.8 },
    },
  );
  gsap.from(strip.querySelectorAll('li'), {
    y: 50,
    rotate: (i) => (i % 2 ? 4 : -4),
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.05,
    ease: 'expo.out',
    scrollTrigger: { trigger: strip, start: 'top 88%', once: true },
  });
  ScrollTrigger.refresh();
}

/*
 * En la vista previa de Claude los enlaces de descarga no funcionan solos:
 * se pide el archivo y se ofrece con el permiso de descargas del visor.
 * En la web publicada se usa el enlace normal con "download".
 */
function previewDownloads(fileUrl) {
  document.querySelectorAll('[data-brochure-download]').forEach((a) =>
    a.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        const downloads = await window.claude?.use?.('downloads');
        if (!downloads) return;
        const blob = await fetch(fileUrl).then((r) => r.blob());
        await downloads.save({ filename: 'Brochure-Mercado-San-Martin.pdf', data: blob });
      } catch {
        /* La persona canceló o el visor no permite descargas aquí. */
      }
    }),
  );
}
