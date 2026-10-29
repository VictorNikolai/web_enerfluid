import data from '../data/mercado.json';
import { escapeHtml } from '../utils/format.js';
import { picture } from '../utils/media.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';
import { scrollToTarget } from './smoothScroll.js';

/*
 * Secciones de presentación (solo muestran información, no piden datos):
 * palabra rotativa de la portada, comparador antes / ahora, tarjetas
 * "Por qué San Martín", rubros en movimiento y el titular del cierre.
 */

/** Portada: "Tu puesto para ___" cambia de rubro cada pocos segundos. */
export function initRotator() {
  const box = document.querySelector('[data-rotator]');
  if (!box) return;
  const words = ['abarrotes', 'frutas y verduras', 'carnes y pollo', 'comidas y jugos', 'ropa y calzado', 'tu negocio'];
  box.innerHTML = `<span>${words[0]}</span>`;
  const word = box.firstElementChild;
  if (prefersReducedMotion) return;

  let i = 0;
  let timer = null;
  const next = () => {
    i = (i + 1) % words.length;
    gsap.timeline()
      .to(word, { yPercent: -110, duration: 0.45, ease: 'expo.in' })
      .add(() => {
        // El resaltado amarillo cambia de ancho con la palabra.
        const from = box.offsetWidth;
        word.textContent = words[i];
        const to = box.offsetWidth;
        gsap.fromTo(box, { width: from }, { width: to, duration: 0.5, ease: 'expo.out', clearProps: 'width' });
      })
      .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', immediateRender: false });
  };
  const start = () => {
    clearInterval(timer);
    timer = setInterval(next, 2600);
  };
  // Empieza después de la apertura y se detiene cuando la portada no se ve.
  setTimeout(start, 3200);
  ScrollTrigger.create({
    trigger: '[data-hero]',
    start: 'top top',
    end: 'bottom top',
    onLeave: () => clearInterval(timer),
    onEnterBack: start,
  });
}

/** Comparador: se arrastra la línea para ver la obra y el mercado terminado. */
export function initCompare() {
  const root = document.querySelector('[data-compare]');
  if (!root) return;
  const range = root.querySelector('[data-compare-range]');
  const set = (value) => {
    root.style.setProperty('--pos', `${value}%`);
    range.value = value;
  };
  range.addEventListener('input', () => set(Number(range.value)));
  set(50);

  // Al entrar en pantalla la línea se mueve sola para mostrar que se puede arrastrar.
  if (prefersReducedMotion) return;
  const state = { v: 50 };
  ScrollTrigger.create({
    trigger: root,
    start: 'top 70%',
    once: true,
    onEnter: () =>
      gsap.timeline({ onUpdate: () => set(state.v), delay: 0.6 })
        .to(state, { v: 82, duration: 0.9, ease: 'power2.inOut' })
        .to(state, { v: 22, duration: 1.2, ease: 'power2.inOut' })
        .to(state, { v: 50, duration: 0.9, ease: 'power2.inOut' }),
  });
}

/** "Por qué San Martín": tarjetas que se apilan; la de atrás se achica y oscurece. */
export function initWhy() {
  const stack = document.querySelector('[data-why]');
  if (!stack) return;
  stack.innerHTML = data.why
    .map(
      (item, i) => `
      <li class="why-card why-card--${i % 4}" style="--i:${i}">
        <div class="why-inner">
          <div class="why-text">
            <span class="why-icon" aria-hidden="true"><i class="${item.icon}"></i></span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            <ul class="why-tags">${item.tags.map((t) => `<li><i class="ri-check-line" aria-hidden="true"></i> ${escapeHtml(t)}</li>`).join('')}</ul>
          </div>
          <figure class="why-photo" data-shutter>
            ${picture(item.src, { alt: item.title, sizes: '(max-width: 860px) 92vw, 44vw', focus: item.focus })}
          </figure>
        </div>
      </li>`,
    )
    .join('');

  if (prefersReducedMotion) return;
  const cards = [...stack.children];
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    const inner = card.querySelector('.why-inner');
    if (next) {
      gsap.to(inner, {
        scale: 0.9,
        ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true },
      });
    }
    // El texto de cada tarjeta entra escalonado.
    gsap.from(card.querySelectorAll('.why-text > *, .why-tags li'), {
      y: 30,
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 70%', once: true },
    });
  });
}

/** Rubros: dos cintas de tarjetas en sentidos opuestos; aceleran con el scroll. */
export function initTrades() {
  const box = document.querySelector('[data-trades]');
  if (!box) return;
  const list = data.rubros.filter((r) => r.icon);
  const card = (r) => `
    <li><button type="button" class="trade" data-pick="${escapeHtml(r.name)}" data-tilt>
      <span class="trade-icon"><i class="${r.icon}" aria-hidden="true"></i></span>
      <span class="trade-name">${escapeHtml(r.name)}</span>
      <span class="trade-go">Lo quiero <i class="ri-arrow-right-line" aria-hidden="true"></i></span>
    </button></li>`;
  const half = Math.ceil(list.length / 2);
  const rows = [list.slice(0, half), list.slice(half)];
  box.innerHTML = rows
    .map(
      (row, r) => `
      <div class="trades-row${r ? ' is-reverse' : ''}">
        <ul class="trades-track">${row.map(card).join('')}${row.map(card).join('').replaceAll('<li>', '<li aria-hidden="true">').replaceAll('<button type="button"', '<button type="button" tabindex="-1"')}</ul>
      </div>`,
    )
    .join('');

  box.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pick]');
    if (!button) return;
    document.dispatchEvent(new CustomEvent('rubro:pick', { detail: button.dataset.pick }));
    scrollToTarget(document.getElementById('separa'));
  });

  if (prefersReducedMotion) return;
  const tweens = [...box.querySelectorAll('.trades-track')].map((track, r) =>
    gsap.fromTo(track, { xPercent: r ? -50 : 0 }, { xPercent: r ? 0 : -50, duration: 38, ease: 'none', repeat: -1 }),
  );
  // Con el mouse encima se frena para poder elegir.
  box.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && tweens.forEach((t) => gsap.to(t, { timeScale: 0.15, duration: 0.6 })));
  box.addEventListener('pointerleave', () => tweens.forEach((t) => gsap.to(t, { timeScale: 1, duration: 0.6 })));
  ScrollTrigger.create({
    trigger: box,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
      tweens.forEach((t) => gsap.to(t, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.2 }) }));
    },
  });
}

/** Cierre: las líneas del titular llegan desde lados opuestos con el scroll. */
export function initFinalTitle() {
  const title = document.querySelector('[data-final-title]');
  if (!title || prefersReducedMotion) return;
  [...title.children].forEach((line, i) => {
    gsap.fromTo(line, { xPercent: i % 2 ? 18 : -18, autoAlpha: 0.15 }, {
      xPercent: 0,
      autoAlpha: 1,
      ease: 'none',
      scrollTrigger: { trigger: title, start: 'top 95%', end: 'center 55%', scrub: 0.6 },
    });
  });
}

/** Medidas del puesto (del brochure): fichas que se encienden una tras otra. */
export function initSpecs() {
  const list = document.querySelector('[data-specs]');
  if (!list) return;
  list.innerHTML = data.specs
    .map(
      (s) => `<li class="spec">
        <span class="spec-icon" aria-hidden="true"><i class="${s.icon}"></i></span>
        <span class="spec-label">${escapeHtml(s.label)}</span>
        <strong class="spec-value">${escapeHtml(s.value)}</strong>
        ${s.note ? `<span class="spec-note">${escapeHtml(s.note)}</span>` : ''}
      </li>`,
    )
    .join('');
  if (prefersReducedMotion) return;
  gsap.from(list.children, {
    y: 26,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.06,
    ease: 'expo.out',
    scrollTrigger: { trigger: list, start: 'top 85%', once: true },
  });
}

/** Ejemplos de puestos armados (abarrotes, carnicería) que flotan suavemente. */
export function initRenders() {
  const list = document.querySelector('[data-renders]');
  if (!list) return;
  list.innerHTML = data.renders
    .map(
      (r) => `<li class="render" data-tilt>
        ${picture(r.src, { alt: r.alt, sizes: '(max-width: 860px) 45vw, 22vw', w: 480 })}
        <span>${escapeHtml(r.caption)}</span>
      </li>`,
    )
    .join('');
}

/** "El mercado de los emprendedores": la franja roja cae y la persona sube detrás. */
export function initFounders() {
  const root = document.querySelector('[data-founders]');
  if (!root || prefersReducedMotion) return;
  const lines = root.querySelectorAll('[data-founders-title] > span');
  gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 72%', once: true } })
    .from(root.querySelector('[data-founders-slash]'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.9, ease: 'expo.inOut' })
    .from(root.querySelector('[data-founders-person]'), { yPercent: 35, autoAlpha: 0, duration: 1.1, ease: 'expo.out' }, '-=0.35')
    .from(lines, { xPercent: (i) => (i % 2 ? 30 : -30), autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out' }, '<0.1')
    .from(root.querySelector('.founders-tag'), { clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'expo.inOut' }, '-=0.6');
}

/**
 * Secciones que "suben" como una lámina: entran con esquinas redondeadas y un
 * poco más angostas, y se estiran a todo el ancho al llegar.
 */
export function initRise() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-rise]').forEach((section) => {
    gsap.fromTo(section, { clipPath: 'inset(0% 5% 0% 5% round 48px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)',
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 35%', scrub: true },
    });
  });
}
