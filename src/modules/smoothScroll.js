import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

let lenis = null;

/** Scroll suave con Lenis, sincronizado con GSAP ScrollTrigger. */
export function initSmoothScroll() {
  if (!prefersReducedMotion) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    const target = id === '#' ? null : document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', id);
  });
}

/*
 * Saltos largos (menú, botones): una cortina roja baja, la página cambia de
 * sección por detrás y la cortina sube enrollándose, como al abrir un puesto.
 */
let shutter = null;
let busy = false;
function curtainJump(target, offset) {
  if (!shutter) {
    shutter = document.createElement('div');
    shutter.className = 'page-shutter';
    shutter.setAttribute('aria-hidden', 'true');
    shutter.innerHTML = '<svg class="page-shutter-lemon"><use href="#lemon" /></svg>';
    document.body.append(shutter);
  }
  busy = true;
  gsap.timeline({ onComplete: () => (busy = false) })
    .set(shutter, { display: 'block', yPercent: -101 })
    .to(shutter, { yPercent: 0, duration: 0.5, ease: 'power3.in' })
    .fromTo(shutter.firstElementChild, { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.1')
    .add(() => {
      lenis.scrollTo(target, { offset, immediate: true, force: true });
      ScrollTrigger.update();
    })
    // Segundo ajuste por si algo cambió de alto al llegar (fotos que cargan).
    .add(() => lenis.scrollTo(target, { offset, immediate: true, force: true }), '+=0.18')
    .to(shutter, { yPercent: -101, duration: 0.75, ease: 'power3.inOut' }, '+=0.05')
    .set(shutter, { display: 'none' });
}

export function scrollToTarget(target) {
  const offset = -(document.querySelector('[data-header]')?.offsetHeight ?? 0) + 1;
  if (lenis) {
    // Lenis ya respeta el scroll-padding-top del encabezado (ver base.css): no se resta otra vez.
    const lenisOffset = 1;
    const distance = Math.abs(target.getBoundingClientRect().top);
    if (distance > window.innerHeight * 1.8 && !busy) curtainJump(target, lenisOffset);
    else lenis.scrollTo(target, { offset: lenisOffset });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
  // Mueve el foco al destino para quien navega con teclado o lector de pantalla.
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.classList.toggle('is-locked', locked);
}
