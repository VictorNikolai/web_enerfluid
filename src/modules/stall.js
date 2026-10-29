import data from '../data/mercado.json';
import { escapeHtml } from '../utils/format.js';
import { picture } from '../utils/media.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

const AUTO_SECONDS = 5;

/**
 * "Así es tu puesto por dentro": puntos sobre la foto sincronizados con la lista.
 * Mientras la sección está en pantalla avanza solo; se detiene cuando la persona interactúa.
 */
export function initStall() {
  const root = document.querySelector('[data-stall]');
  if (!root) return;
  const { stall } = data;
  const media = root.querySelector('[data-stall-media]');
  const spots = root.querySelector('[data-hotspots]');
  const list = root.querySelector('[data-stall-list]');

  media.innerHTML = picture(stall.src, { alt: stall.alt, sizes: '(max-width: 960px) 100vw, 58vw' });

  spots.innerHTML = stall.features
    .map(
      (f, i) => `<button type="button" class="hotspot" style="--x:${f.x}%;--y:${f.y}%" data-i="${i}"
        aria-pressed="false" aria-label="${escapeHtml(f.title)}">${i + 1}</button>`,
    )
    .join('');
  list.innerHTML = stall.features
    .map(
      (f, i) => `
      <li class="stall-item" data-i="${i}">
        <button type="button" aria-expanded="false" aria-controls="stall-body-${i}">
          <span class="num" aria-hidden="true">${i + 1}</span>
          <span>${escapeHtml(f.title)}</span>
          <i class="ri-arrow-right-s-line chev" aria-hidden="true"></i>
        </button>
        <div class="stall-body" id="stall-body-${i}">
          <div>
            <span class="stall-timer" aria-hidden="true"><span></span></span>
            <p>${escapeHtml(f.text)}</p>
            ${f.detail ? picture(f.detail, { alt: `Detalle: ${f.title}`, sizes: '(max-width: 960px) 90vw, 36vw' }) : ''}
          </div>
        </div>
      </li>`,
    )
    .join('');

  const hotspots = [...spots.children];
  const items = [...list.children];
  let active = -1;
  let auto = !prefersReducedMotion;
  let timer = null;

  function activate(i, fromUser = false) {
    if (fromUser) stopAuto();
    if (i === active) return;
    active = i;
    hotspots.forEach((h, k) => h.setAttribute('aria-pressed', String(k === i)));
    items.forEach((item, k) => {
      item.classList.toggle('is-active', k === i);
      item.querySelector('button').setAttribute('aria-expanded', String(k === i));
    });
    if (!prefersReducedMotion) {
      gsap.fromTo(hotspots[i], { scale: 0.6 }, { scale: 1.18, duration: 0.6, ease: 'back.out(3)' });
    }
    if (auto) runTimer();
  }

  function runTimer() {
    timer?.kill();
    const fill = items[active].querySelector('.stall-timer span');
    items.forEach((item) => gsap.set(item.querySelector('.stall-timer span'), { scaleX: 0 }));
    timer = gsap.to(fill, {
      scaleX: 1,
      duration: AUTO_SECONDS,
      ease: 'none',
      paused: !inView,
      onComplete: () => activate((active + 1) % items.length),
    });
  }

  function stopAuto() {
    if (!auto) return;
    auto = false;
    timer?.kill();
    root.querySelectorAll('.stall-timer').forEach((t) => t.remove());
  }

  let inView = false;
  ScrollTrigger.create({
    trigger: root,
    start: 'top 70%',
    end: 'bottom 30%',
    onToggle: ({ isActive }) => {
      inView = isActive;
      if (!timer) return;
      isActive ? timer.play() : timer.pause();
    },
  });

  spots.addEventListener('click', (event) => {
    const h = event.target.closest('[data-i]');
    if (h) activate(Number(h.dataset.i), true);
  });
  list.addEventListener('click', (event) => {
    const item = event.target.closest('button')?.closest('[data-i]');
    if (item) activate(Number(item.dataset.i), true);
  });

  if (!auto) root.querySelectorAll('.stall-timer').forEach((t) => t.remove());
  activate(0);
}
