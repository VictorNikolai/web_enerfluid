import { escapeHtml } from '../utils/format.js';
import { src, srcset, dimensions } from '../utils/media.js';
import { prefersReducedMotion } from './motion.js';
import { lockScroll } from './smoothScroll.js';

/*
 * Visor de fotos a pantalla completa con PhotoSwipe: zoom con pellizco o
 * doble toque, arrastre, deslizar para cambiar y deslizar hacia abajo para cerrar.
 * Se carga solo la primera vez que alguien abre una foto.
 *
 *   getLightbox().open({ title, photos: [{ src, caption, focus }] }, inicio, miniaturas?)
 *
 * `src` es la base de la foto ("/img/mercado/pasillo-central"). `miniaturas`
 * (opcional) son los <img> de la página: la foto "crece" desde ahí al abrir.
 */
let loader = null;
const load = () => {
  loader ??= Promise.all([import('photoswipe'), import('photoswipe/style.css')]).then(([m]) => m.default);
  return loader;
};

const ICONS = {
  close: '<i class="ri-close-line" aria-hidden="true"></i>',
  arrow: '<i class="ri-arrow-right-line" aria-hidden="true"></i>',
  zoom: '<i class="ri-zoom-in-line" aria-hidden="true"></i>',
};

function slides(photos, thumbs) {
  return photos.map((p, i) => {
    const [width, height] = dimensions(p.src);
    return {
      src: src(p.src, 1800),
      srcset: srcset(p.src),
      msrc: src(p.src, 480),
      width,
      height,
      alt: p.caption,
      caption: p.caption,
      thumb: src(p.src, 480),
      focus: p.focus,
      element: thumbs?.[i],
      thumbCropped: true,
    };
  });
}

function registerUi(pswp, title) {
  pswp.on('uiRegister', () => {
    pswp.ui.registerElement({
      name: 'title',
      order: 5,
      appendTo: 'bar',
      onInit: (el) => {
        el.className += ' pswp-title';
        el.textContent = title;
      },
    });

    pswp.ui.registerElement({
      name: 'caption',
      order: 9,
      appendTo: 'root',
      onInit: (el) => {
        el.setAttribute('aria-live', 'polite');
        pswp.on('change', () => {
          el.textContent = pswp.currSlide?.data.caption ?? '';
        });
      },
    });

    pswp.ui.registerElement({
      name: 'thumbs',
      order: 10,
      appendTo: 'root',
      onInit: (el) => {
        el.setAttribute('role', 'group');
        el.setAttribute('aria-label', 'Elegir foto');
        const items = pswp.options.dataSource;
        el.innerHTML = items
          .map((s, i) => `<button type="button" data-index="${i}" aria-label="Foto ${i + 1}: ${escapeHtml(s.caption)}"><img src="${s.thumb}" alt="" loading="lazy" style="object-position:${escapeHtml(s.focus ?? '50% 50%')}" /></button>`)
          .join('');
        el.addEventListener('click', (event) => {
          const button = event.target.closest('[data-index]');
          if (button) pswp.goTo(Number(button.dataset.index));
        });
        pswp.on('change', () => {
          [...el.children].forEach((b, i) => b.setAttribute('aria-current', String(i === pswp.currIndex)));
          el.children[pswp.currIndex]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        });
      },
    });
  });
}

export function getLightbox() {
  return {
    async open({ title, photos }, start = 0, thumbs) {
      const PhotoSwipe = await load();
      const zoomFromThumb = !prefersReducedMotion && thumbs?.[start];
      const pswp = new PhotoSwipe({
        dataSource: slides(photos, thumbs),
        index: start,
        bgOpacity: 1,
        showHideAnimationType: prefersReducedMotion ? 'none' : zoomFromThumb ? 'zoom' : 'fade',
        imageClickAction: 'zoom',
        tapAction: 'toggle-controls',
        wheelToZoom: true,
        padding: { top: 64, bottom: 150, left: 16, right: 16 },
        paddingFn: (viewport) =>
          viewport.x < 640 ? { top: 56, bottom: 130, left: 0, right: 0 } : { top: 64, bottom: 150, left: 72, right: 72 },
        closeTitle: 'Cerrar',
        zoomTitle: 'Acercar',
        arrowPrevTitle: 'Foto anterior',
        arrowNextTitle: 'Foto siguiente',
        errorMsg: 'No se pudo cargar la foto.',
        indexIndicatorSep: ' de ',
        closeSVG: ICONS.close,
        zoomSVG: ICONS.zoom,
        arrowPrevSVG: ICONS.arrow,
        arrowNextSVG: ICONS.arrow,
        mainClass: 'pswp--brand',
      });
      registerUi(pswp, title);
      pswp.on('beforeOpen', () => lockScroll(true));
      pswp.on('destroy', () => lockScroll(false));
      pswp.init();
      return pswp;
    },
  };
}
