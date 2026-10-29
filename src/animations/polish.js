import { gsap, ScrollTrigger, prefersReducedMotion } from '../modules/motion.js';

/** El video de portada se acerca y el texto sube un poco mientras se baja. */
export function initHeroScroll() {
  const hero = document.querySelector('[data-hero]');
  if (!hero || prefersReducedMotion) return;
  const scroll = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
  gsap.to(hero.querySelector('[data-hero-media]'), { scale: 1.15, ease: 'none', scrollTrigger: scroll });
  gsap.to(hero.querySelector('.hero-content'), { yPercent: -18, ease: 'none', scrollTrigger: scroll });
}

/** Botones principales que se acercan al cursor (solo con mouse). */
export function initMagnetic() {
  if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('.btn-lg, .header-cta').forEach((button) => {
    const toX = gsap.quickTo(button, 'x', { duration: 0.5, ease: 'power3.out' });
    const toY = gsap.quickTo(button, 'y', { duration: 0.5, ease: 'power3.out' });
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      toX((event.clientX - rect.left - rect.width / 2) * 0.25);
      toY((event.clientY - rect.top - rect.height / 2) * 0.35);
    });
    button.addEventListener('pointerleave', () => {
      toX(0);
      toY(0);
    });
  });
}

/** Botón para volver arriba: aparece tras la portada y su limón gira con el scroll. */
export function initToTop() {
  const button = document.querySelector('[data-to-top]');
  const hero = document.querySelector('[data-hero]');
  if (!button) return;
  const update = (progress) => {
    button.style.setProperty('--progress', progress.toFixed(4));
    button.classList.toggle('is-visible', window.scrollY > (hero?.offsetHeight ?? 600) * 0.6);
  };
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: ({ progress }) => update(progress),
    onRefresh: ({ progress }) => update(progress),
  });
}

/** La marca grande del pie se desliza en sentido contrario al scroll. */
export function initFooterMark() {
  const mark = document.querySelector('[data-footer-mark]');
  if (!mark || prefersReducedMotion) return;
  gsap.fromTo(mark.firstElementChild, { xPercent: 8 }, {
    xPercent: -12,
    ease: 'none',
    scrollTrigger: { trigger: mark, start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}
