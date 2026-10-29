import { gsap, ScrollTrigger, prefersReducedMotion } from '../modules/motion.js';

const finePointer = () => window.matchMedia('(pointer: fine)').matches;

/**
 * Fotos que se descubren como la cortina de un puesto: una persiana roja
 * sube y la foto se acomoda con un pequeño zoom.
 */
export function initShutterReveal() {
  if (prefersReducedMotion) return;
  document.querySelectorAll('[data-shutter]').forEach((box) => {
    const curtain = document.createElement('span');
    curtain.className = 'shutter-reveal';
    curtain.setAttribute('aria-hidden', 'true');
    box.append(curtain);
    const img = box.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 82%', once: true } })
      .to(curtain, { scaleY: 0, duration: 1.15, ease: 'power3.inOut' })
      .from(img, { scale: 1.25, duration: 1.6, ease: 'expo.out', clearProps: 'scale' }, 0.25)
      .add(() => curtain.remove());
  });
}

/** Tarjetas que se inclinan en 3D siguiendo el mouse. */
export function initTilt() {
  if (prefersReducedMotion || !finePointer()) return;
  document.addEventListener('pointerover', (event) => {
    const el = event.target.closest?.('[data-tilt]');
    if (!el || el.dataset.tiltReady) return;
    el.dataset.tiltReady = '1';
    gsap.set(el, { transformPerspective: 700 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}

/**
 * Cursor acompañante (solo con mouse): un anillo rojo que sigue al puntero y
 * crece con un texto ("Ver", "Arrastra", "Elegir") sobre las zonas interactivas.
 */
export function initCursor() {
  if (prefersReducedMotion || !finePointer()) return;
  const labels = [
    ['.tour-photo, .frame-photo', 'Ver'],
    ['.trade', 'Elegir'],
    ['.hotspot', 'Abrir'],
  ];
  labels.forEach(([sel, text]) => document.querySelectorAll(sel).forEach((el) => (el.dataset.cursor ||= text)));

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor-label"></span>';
  document.body.append(cursor);
  const label = cursor.firstElementChild;
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    cursor.classList.add('is-on');
    x(e.clientX);
    y(e.clientY);
    const target = e.target.closest?.('[data-cursor]');
    const text = target?.dataset.cursor ?? '';
    if (label.textContent !== text) label.textContent = text;
    cursor.classList.toggle('has-label', Boolean(text));
    cursor.classList.toggle('is-link', !text && Boolean(e.target.closest?.('a, button, label, input')));
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
}

/**
 * Cinta roja bajo la portada: corre sola, acelera y se inclina con la
 * velocidad del scroll y cambia de sentido cuando se sube.
 */
export function initMarqueeMotion() {
  const track = document.querySelector('[data-marquee]');
  if (!track || prefersReducedMotion) return;
  track.style.animation = 'none';
  const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  const skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3.out' });
  let direction = 1;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const v = self.getVelocity();
      if (self.direction !== direction) {
        direction = self.direction;
      }
      const speed = Math.min(Math.abs(v) / 120, 8);
      gsap.to(loop, { timeScale: direction * (1 + speed), duration: 0.25, overwrite: true });
      gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25 });
      skew(Math.max(-8, Math.min(8, v / -250)));
      clearTimeout(track._t);
      track._t = setTimeout(() => skew(0), 120);
    },
  });
}
