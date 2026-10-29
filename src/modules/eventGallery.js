import events from '../data/events.json';
import { escapeHtml, formatDate } from '../utils/format.js';
import { getLightbox } from './lightbox.js';
import { picture } from '../utils/media.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

/*
 * Sección de eventos: fotos enmarcadas como en una exposición.
 * Para añadir un evento o fotos, edita src/data/events.json y coloca las
 * imágenes en public/img/eventos/<evento>/<nombre>-{480,960,1800}.webp.
 */
export function initEvents() {
  const section = document.querySelector('[data-events]');
  if (!section || !events.length) {
    section?.remove();
    return;
  }

  const mosaic = section.querySelector('[data-event-mosaic]');
  const tabs = section.querySelector('[data-event-tabs]');
  let current = events[0];

  function render(event) {
    current = event;
    section.querySelector('[data-event-name]').textContent = event.name;
    section.querySelector('[data-event-title]').textContent = event.title;
    section.querySelector('[data-event-summary]').textContent = event.summary;

    const meta = [
      ['ri-map-pin-2-line', event.place],
      event.date ? ['ri-calendar-event-line', formatDate(event.date)] : null,
      ['ri-camera-3-line', `${event.photos.length} fotos`],
    ].filter(Boolean);
    section.querySelector('[data-event-meta]').innerHTML = meta
      .map(([icon, text]) => `<li><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(text)}</li>`)
      .join('');

    mosaic.innerHTML = event.photos
      .map(
        (photo, i) => `
        <figure class="frame">
          <button type="button" class="frame-photo" data-photo="${i}" aria-label="Ampliar foto: ${escapeHtml(photo.caption)}">
            <span class="frame-window" style="--ratio:${photo.ratio}">
              ${picture(photo.src, {
                alt: photo.caption,
                sizes: i === 0 ? '(max-width: 960px) 100vw, 58vw' : '(max-width: 960px) 50vw, 34vw',
                focus: photo.focus,
              })}
            </span>
            <span class="frame-zoom" aria-hidden="true"><i class="ri-zoom-in-line"></i></span>
          </button>
          <figcaption>${escapeHtml(photo.caption)}</figcaption>
        </figure>`,
      )
      .join('');
    ScrollTrigger.refresh();
  }

  // Pestañas solo cuando hay más de un evento.
  if (events.length > 1) {
    tabs.hidden = false;
    tabs.innerHTML = events
      .map((e, i) => `<button type="button" role="tab" class="filter${i === 0 ? ' is-active' : ''}" aria-selected="${i === 0}" data-event="${i}">${escapeHtml(e.name)}</button>`)
      .join('');
    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-event]');
      if (!tab) return;
      tabs.querySelectorAll('[data-event]').forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      render(events[Number(tab.dataset.event)]);
      settle(true);
    });
  }

  const open = (start) =>
    getLightbox().open({ title: current.name, photos: current.photos }, start, [...mosaic.querySelectorAll('.frame-window img')]);
  mosaic.addEventListener('click', (event) => {
    const button = event.target.closest('[data-photo]');
    if (button) open(Number(button.dataset.photo));
  });
  section.querySelector('[data-event-open-all]').addEventListener('click', () => open(0));

  // Los cuadros "se asientan" en la pared al entrar en pantalla. Siempre visibles.
  function settle(immediate = false) {
    if (prefersReducedMotion) return;
    gsap.from(mosaic.querySelectorAll('.frame'), {
      y: 48,
      rotate: (i) => (i % 2 ? 1.6 : -1.6),
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      ...(immediate ? {} : { scrollTrigger: { trigger: mosaic, start: 'top 82%', once: true } }),
    });
  }

  render(current);
  settle();
}
