import { gsap, prefersReducedMotion } from '../modules/motion.js';

/**
 * Apertura de la web: una cortina enrollable roja (como la de los puestos)
 * con el logo sube y descubre el video. Luego el titular sube línea por línea.
 */
export function playIntro(onComplete = () => {}) {
  const lines = document.querySelectorAll('[data-hero-title] .line > span');
  const fades = document.querySelectorAll('[data-hero-fade]');
  const header = document.querySelector('[data-header]');

  if (prefersReducedMotion) {
    document.documentElement.classList.add('intro-ready');
    return onComplete();
  }

  const shutter = document.createElement('div');
  shutter.className = 'shutter';
  shutter.setAttribute('aria-hidden', 'true');
  shutter.innerHTML = '<img class="shutter-logo" src="/img/logo-mercado-san-martin-blanco.png" alt="" />';
  document.body.append(shutter);
  const logo = shutter.querySelector('img');

  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    document.documentElement.classList.add('intro-ready');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo(logo, { autoAlpha: 0, scale: 0.92, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7 })
      // La cortina "se suelta" un poco y luego sube enrollándose.
      .to(shutter, { yPercent: 2.5, duration: 0.25, ease: 'power2.out' }, '+=0.35')
      .to(logo, { autoAlpha: 0, y: -30, duration: 0.4, ease: 'power2.in' }, '<')
      .to(shutter, { yPercent: -101, duration: 1.15, ease: 'power3.inOut' })
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.1 }, '-=0.55')
      .fromTo(fades, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, '<0.25')
      .fromTo(header, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.8 }, '<')
      .add(() => {
        shutter.remove();
        gsap.set(header, { clearProps: 'transform' });
        onComplete();
      });
  };

  // Espera al logo (y como máximo 1.2 s) para no animar una caja vacía.
  if (logo.complete) run();
  else {
    const timer = setTimeout(run, 1200);
    logo.addEventListener('load', () => {
      clearTimeout(timer);
      run();
    }, { once: true });
  }
}
