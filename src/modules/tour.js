import data from '../data/mercado.json';
import { escapeHtml } from '../utils/format.js';
import { getLightbox } from './lightbox.js';
import { picture } from '../utils/media.js';
import { gsap, prefersReducedMotion } from './motion.js';

/**
 * Recorrido del mercado.
 * Escritorio: la sección queda fija y las fotos avanzan en horizontal con el scroll.
 * Móvil o "reducir movimiento": carrusel horizontal nativo con deslizamiento.
 */
export function initTour() {
  const section = document.querySelector('[data-tour]');
  if (!section) return;
  const pin = section.querySelector('[data-tour-pin]');
  const track = section.querySelector('[data-tour-track]');
  const current = section.querySelector('[data-tour-current]');
  const bar = section.querySelector('[data-tour-bar]');
  const stops = data.tour;

  section.querySelector('[data-tour-total]').textContent = stops.length;
  track.innerHTML = stops
    .map(
      (stop, i) => `
      <li class="tour-stop">
        <button type="button" class="tour-photo" data-index="${i}" aria-label="Ampliar foto: ${escapeHtml(stop.title)}">
          <span>${picture(stop.src, { alt: stop.caption, sizes: '(max-width: 900px) 84vw, 68vw', focus: stop.focus })}</span>
        </button>
        <div class="tour-text">
          <span class="tour-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(stop.title)}</h3>
          <p>${escapeHtml(stop.caption)}</p>
        </div>
      </li>`,
    )
    .join('');

  const setProgress = (progress) => {
    const index = Math.min(stops.length - 1, Math.round(progress * (stops.length - 1)));
    current.textContent = index + 1;
    bar.parentElement.style.setProperty('--tour-progress', Math.max(progress, 1 / stops.length).toFixed(3));
  };

  track.addEventListener('click', (event) => {
    const photo = event.target.closest('[data-index]');
    if (photo) getLightbox().open({ title: 'Recorrido del Mercado San Martín', photos: stops.map((s) => ({ ...s, caption: `${s.title}: ${s.caption}` })) }, Number(photo.dataset.index));
  });

  const native = () => {
    section.classList.add('is-native');
    const onScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      setProgress(max > 0 ? track.scrollLeft / max : 0);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      section.classList.remove('is-native');
      track.removeEventListener('scroll', onScroll);
    };
  };

  if (prefersReducedMotion) {
    native();
    return;
  }

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const move = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => setProgress(progress),
      },
    });
    // Parallax dentro de cada foto mientras pasa por la pantalla.
    track.querySelectorAll('.tour-photo img').forEach((img) => {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: img.closest('.tour-stop'), containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
      });
    });
    setProgress(0);
  });
  mm.add('(max-width: 899px)', () => native());
}
