import data from '../data/mercado.json';
import { whatsappLink } from '../config.js';
import { escapeHtml } from '../utils/format.js';
import { picture } from '../utils/media.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

/*
 * ¿Por qué invertir?
 * Computadora: los 6 beneficios orbitan alrededor del centro ("3 meses").
 *   Anillos que giran, líneas que se dibujan hacia cada beneficio y un foco
 *   que pasa de uno a otro solo (se detiene al pasar el mouse).
 * Celular y tablet: una línea de tiempo vertical; el beneficio que está en
 *   el centro de la pantalla se enciende mientras se baja.
 * Con "reducir movimiento" todo queda quieto y legible.
 */
const NS = 'http://www.w3.org/2000/svg';
const DESKTOP = '(min-width: 961px)';

export function initInvest() {
  const box = document.querySelector('[data-invest]');
  if (!box) return;
  const { center, items } = data.invest;

  box.innerHTML = `
    <svg class="invest-rings" aria-hidden="true" data-invest-rings></svg>
    <div class="invest-sats" aria-hidden="true" data-invest-sats><div><span></span><span></span></div></div>
    <div class="invest-core" data-invest-core>
      <svg class="invest-progress" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="invest-progress-track" cx="60" cy="60" r="56" />
        <circle class="invest-progress-bar" cx="60" cy="60" r="56" pathLength="100" data-invest-bar />
      </svg>
      <div class="invest-core-photo">
        ${picture('/img/mercado/puesto-interior', { alt: '', sizes: '(max-width: 960px) 60vw, 300px' })}
      </div>
      <div class="invest-core-text">
        <i class="${center.icon}" aria-hidden="true"></i>
        <strong><span data-invest-count>3</span> meses</strong>
        <span>${escapeHtml(center.title)}</span>
      </div>
      <ol class="invest-months" aria-hidden="true">
        <li style="--m:0">Mes 1</li><li style="--m:1">Mes 2</li><li style="--m:2">Mes 3</li>
      </ol>
    </div>
    <ul class="invest-items" data-invest-items>
      <li class="invest-track" aria-hidden="true"><span data-invest-track></span></li>
      ${items
        .map(
          (it, i) => `<li class="invest-item" style="--i:${i};--n:${items.length}" data-invest-item="${i}" tabindex="0">
            <span class="invest-icon" aria-hidden="true"><i class="${it.icon}"></i></span>
            <span class="invest-copy">
              <h3>${escapeHtml(it.title)}</h3>
              <p>${escapeHtml(it.text)}</p>
            </span>
          </li>`,
        )
        .join('')}
    </ul>`;
  box.insertAdjacentHTML(
    'afterend',
    `<div class="invest-cta">
      <a class="btn btn-lemon btn-lg" data-invest-wa target="_blank" rel="noopener"><i class="ri-whatsapp-line" aria-hidden="true"></i> Quiero invertir</a>
      <a class="btn btn-on-dark btn-lg" href="#plano"><i class="ri-layout-grid-line" aria-hidden="true"></i> Ver el plano</a>
    </div>`,
  );
  const cta = box.nextElementSibling;

  cta.querySelector('[data-invest-wa]').href = whatsappLink(
    'ventas',
    'Hola Mercado San Martín, vi la web y quiero invertir en un puesto. ¿Me pueden dar información de precios y formas de pago?',
  );

  const nodes = [...box.querySelectorAll('[data-invest-item]')];
  const rings = box.querySelector('[data-invest-rings]');
  const bar = box.querySelector('[data-invest-bar]');
  const count = box.querySelector('[data-invest-count]');

  // Foco en un beneficio (por el ciclo, el mouse, el teclado o el scroll).
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    nodes.forEach((n, k) => n.classList.toggle('is-active', k === i));
    rings.querySelectorAll('.invest-line').forEach((l, k) => l.classList.toggle('is-active', k === i));
    const dot = rings.querySelector('.invest-pulse');
    const line = rings.querySelectorAll('.invest-line')[i];
    if (dot && line && !prefersReducedMotion) {
      gsap.killTweensOf(dot);
      gsap.fromTo(
        dot,
        { attr: { cx: line.getAttribute('x1'), cy: line.getAttribute('y1') }, autoAlpha: 1 },
        { attr: { cx: line.getAttribute('x2'), cy: line.getAttribute('y2') }, duration: 0.9, ease: 'power2.inOut', onComplete: () => gsap.to(dot, { autoAlpha: 0, duration: 0.3 }) },
      );
    }
  };

  /** Dibuja anillos y líneas con las medidas reales del recuadro (se rehace al cambiar el tamaño). */
  function drawRings() {
    const w = box.clientWidth;
    const h = box.clientHeight;
    rings.setAttribute('viewBox', `0 0 ${w} ${h}`);
    rings.innerHTML = '';
    const desktop = window.matchMedia(DESKTOP).matches;
    if (!desktop) return;
    const core = box.querySelector('[data-invest-core]');
    const cx = core.offsetLeft + core.offsetWidth / 2;
    const cy = core.offsetTop + core.offsetHeight / 2;
    const make = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      rings.append(n);
      return n;
    };
    make('ellipse', { cx, cy, rx: w * 0.39, ry: h * 0.4, class: 'invest-ring invest-ring--outer', pathLength: 100 });
    make('ellipse', { cx, cy, rx: w * 0.26, ry: h * 0.27, class: 'invest-ring invest-ring--inner', pathLength: 100 });
    // Posiciones sin transformaciones (las animaciones no las alteran).
    // Cada beneficio está anclado por su centro (translate: -50% -50%).
    nodes.forEach((n, k) => {
      const icon = n.querySelector('.invest-icon');
      const left = n.offsetLeft - n.offsetWidth / 2;
      const top = n.offsetTop - n.offsetHeight / 2;
      let x2 = left + icon.offsetLeft + icon.offsetWidth / 2;
      let y2 = top + icon.offsetTop + icon.offsetHeight / 2;
      // La línea termina en el borde del beneficio: no cruza su texto.
      const inside = (x, y) => x > left - 8 && x < left + n.offsetWidth + 8 && y > top - 8 && y < top + n.offsetHeight + 8;
      const ex = x2;
      const ey = y2;
      for (let t = 1; t > 0 && inside(x2, y2); t -= 0.01) {
        x2 = cx + (ex - cx) * t;
        y2 = cy + (ey - cy) * t;
      }
      const line = make('line', { x1: cx, y1: cy, x2, y2, class: 'invest-line', pathLength: 100 });
      line.style.setProperty('--k', k);
    });
    make('circle', { cx, cy, r: 6, class: 'invest-pulse' });
    // Satélites que recorren el anillo exterior: un círculo que gira, achatado
    // hasta la forma del anillo (solo transformaciones: no cuesta al celular).
    const sats = box.querySelector('[data-invest-sats]');
    sats.style.setProperty('--cx', `${cx}px`);
    sats.style.setProperty('--cy', `${cy}px`);
    sats.style.setProperty('--rx', `${w * 0.39}px`);
    sats.style.setProperty('--k', ((h * 0.4) / (w * 0.39)).toFixed(4));
    if (active >= 0) rings.querySelectorAll('.invest-line')[active]?.classList.add('is-active');
  }

  const redraw = () => requestAnimationFrame(drawRings);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redraw, 200);
  });
  document.fonts.ready.then(redraw);
  ScrollTrigger.addEventListener('refresh', redraw);

  // Interacción directa: mouse y teclado.
  let paused = false;
  nodes.forEach((n, i) => {
    n.addEventListener('pointerenter', () => {
      paused = true;
      setActive(i);
    });
    n.addEventListener('pointerleave', () => (paused = false));
    n.addEventListener('focus', () => {
      paused = true;
      setActive(i);
    });
    n.addEventListener('blur', () => (paused = false));
  });

  if (prefersReducedMotion) {
    bar.style.strokeDashoffset = '0';
    box.classList.add('is-drawn');
    return;
  }

  // El contador sube de 0 a 3 mientras el anillo de avance se completa (mes 1, 2, 3).
  const fillProgress = () => {
    const state = { v: 0 };
    return gsap.timeline()
      .fromTo(bar, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
      .to(state, { v: 3, duration: 1.8, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(state.v)) }, 0)
      .from(box.querySelectorAll('.invest-months li'), { autoAlpha: 0, scale: 0.6, stagger: 0.55, duration: 0.4, ease: 'back.out(3)' }, 0.25);
  };

  const mm = gsap.matchMedia();

  mm.add(DESKTOP, () => {
    let timer = null;
    const cycle = () => {
      if (!paused) setActive((active + 1) % nodes.length);
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(cycle, 2600);
    };
    const stop = () => clearInterval(timer);

    // La animación se arma al llegar (con las medidas de ese momento) y se reproduce una vez.
    let tl = null;
    const reveal = () => {
      if (tl) return;
      tl = gsap.timeline({
        onComplete: () => {
          setActive(0);
          start();
        },
      });
      tl.from(box.querySelector('[data-invest-core]'), { scale: 0.5, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.7)' })
        .add(fillProgress(), '-=0.3')
        // Anillos y líneas se dibujan con CSS (se rehacen si cambia el tamaño).
        .add(() => box.classList.add('is-drawn'), 0.3)
        .from(nodes, {
          x: (k, el) => box.offsetWidth / 2 - el.offsetLeft,
          y: (k, el) => box.offsetHeight / 2 - el.offsetTop,
          scale: 0.2,
          autoAlpha: 0,
          duration: 1.1,
          stagger: 0.09,
          ease: 'expo.out',
          clearProps: 'transform,opacity,visibility',
        }, 0.6)
        .from(cta, { y: 30, autoAlpha: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, '-=0.4');
    };

    const st = ScrollTrigger.create({
      trigger: box,
      start: 'top 70%',
      end: 'bottom top',
      onEnter: reveal,
      onEnterBack: reveal,
      // El ciclo solo corre mientras la sección se ve.
      onToggle: ({ isActive }) => {
        if (!isActive) stop();
        else if (tl?.progress() === 1) start();
      },
    });
    return () => {
      stop();
      st.kill();
      tl?.progress(1).kill();
      box.classList.add('is-drawn');
    };
  });

  mm.add('(max-width: 960px)', () => {
    const track = box.querySelector('[data-invest-track]');
    const list = box.querySelector('[data-invest-items]');
    ScrollTrigger.create({ trigger: box, start: 'top 75%', once: true, onEnter: () => fillProgress() });
    gsap.from(box.querySelector('[data-invest-core]'), {
      scale: 0.7,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'back.out(1.6)',
      scrollTrigger: { trigger: box, start: 'top 80%', once: true },
    });
    // La línea de tiempo se dibuja con el scroll.
    gsap.fromTo(track, { scaleY: 0 }, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: list, start: 'top 65%', end: 'bottom 60%', scrub: 0.5 },
    });
    nodes.forEach((n, i) => {
      gsap.from(n, {
        x: i % 2 ? 36 : -36,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: n, start: 'top 88%', once: true },
      });
      gsap.from(n.querySelector('.invest-icon'), {
        scale: 0.3,
        rotate: -45,
        duration: 0.8,
        ease: 'back.out(2.4)',
        scrollTrigger: { trigger: n, start: 'top 85%', once: true },
      });
      ScrollTrigger.create({
        trigger: n,
        start: 'top 62%',
        end: 'bottom 38%',
        onToggle: ({ isActive }) => isActive && setActive(i),
      });
    });
    gsap.from(cta, { y: 30, autoAlpha: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: cta, start: 'top 92%', once: true } });
  });
}
