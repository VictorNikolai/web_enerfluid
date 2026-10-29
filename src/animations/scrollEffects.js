import { gsap, ScrollTrigger, SplitText, prefersReducedMotion } from '../modules/motion.js';

/** Contadores de la franja de estadísticas: suben al entrar en pantalla. */
export function initCounters() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    const decimals = Number(el.dataset.decimals ?? 0);
    const state = { value: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.fromTo(state, { value: 0 }, {
          value: end,
          duration: 2,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = `${prefix}${state.value.toFixed(decimals)}${suffix}`;
          },
        }),
    });
  });
}

/** Parallax suave de la foto aérea y zoom de la foto de seguridad. */
export function initParallax() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-parallax-wrap]').forEach((wrap) => {
    gsap.fromTo(wrap.querySelector('[data-parallax]'), { yPercent: -6 }, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  document.querySelectorAll('[data-zoom-wrap]').forEach((wrap) => {
    gsap.fromTo(wrap.querySelector('[data-zoom]'), { scale: 1.25 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'center center', scrub: true },
    });
  });
}

/**
 * Títulos de sección: las líneas suben desde una máscara al entrar en pantalla.
 * Sin JavaScript (o con movimiento reducido) el texto se ve normal.
 */
export function initTitleReveal() {
  if (prefersReducedMotion) return;
  document.fonts.ready.then(() => {
    document.querySelectorAll('[data-reveal]').forEach((title) => {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'reveal-line' });
      gsap.from(split.lines, {
        yPercent: 105,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: title, start: 'top 88%', once: true },
      });
    });
  });
}

/** Listas que entran escalonadas (seguridad, valores). Siempre visibles: solo se mueven. */
export function initStaggerLists() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-safety-list], .values').forEach((list) => {
    gsap.from(list.children, {
      x: 40,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: list, start: 'top 82%', once: true },
    });
  });
}

/** Línea de los pasos para separar tu puesto: se dibuja con el scroll. */
export function initStepsLine() {
  const steps = document.querySelector('[data-steps]');
  if (!steps) return;
  const items = [...steps.querySelectorAll('.step')];
  const light = (progress) => {
    steps.style.setProperty('--line', progress.toFixed(3));
    items.forEach((item, i) => item.classList.toggle('is-on', progress >= i / (items.length - 1) - 0.02));
  };
  if (prefersReducedMotion) return light(1);
  ScrollTrigger.create({
    trigger: steps,
    start: 'top 75%',
    end: 'bottom 55%',
    scrub: 0.6,
    onUpdate: ({ progress }) => light(progress),
  });
}

/** Barra fina bajo el encabezado que muestra cuánto se ha leído. */
export function initScrollProgress() {
  const bar = document.querySelector('[data-scroll-progress]');
  if (!bar) return;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: ({ progress }) => bar.style.setProperty('--progress', progress.toFixed(4)),
  });
}

/** Cinta en movimiento continuo: duplica el contenido para un bucle sin cortes. */
export function initMarquee() {
  document.querySelectorAll('[data-marquee]').forEach((track) => {
    const clone = [...track.children].map((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      return copy;
    });
    track.append(...clone);
  });
}
