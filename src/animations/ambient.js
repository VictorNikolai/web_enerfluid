import { prefersReducedMotion } from '../modules/motion.js';

/*
 * Fondos animados hechos con los materiales del mercado.
 *
 *  data-ambient="aurora"  → luz roja y amarilla que se mueve lento detrás de las
 *                           cortinas (canvas a baja resolución: liviano).
 *  data-ambient="lemons"  → rodajas de limón del logo flotando hacia arriba.
 *  .tex-ceramica          → la cuadrícula del piso se ilumina donde está el cursor
 *                           (en celular la luz se pasea sola).
 *
 * Todo se pausa fuera de pantalla y queda quieto con "reducir movimiento".
 */
export function initAmbient() {
  document.querySelectorAll('[data-ambient="aurora"]').forEach(createAurora);
  document.querySelectorAll('[data-ambient="lemons"]').forEach(createLemons);
  initTileGlow();
}

/* ---------- Aurora en canvas ---------- */
const BLOBS = [
  { rgb: '227, 27, 35', alpha: 0.55, size: 0.62, speed: [0.11, 0.08], phase: [0, 1.7], follow: true },
  { rgb: '255, 198, 26', alpha: 0.28, size: 0.42, speed: [0.07, 0.12], phase: [2.1, 0.4] },
  { rgb: '255, 70, 40', alpha: 0.35, size: 0.5, speed: [0.09, 0.05], phase: [4.2, 3.1] },
  { rgb: '30, 155, 215', alpha: 0.14, size: 0.38, speed: [0.05, 0.09], phase: [1.1, 5.3] },
];
const SCALE = 0.18; // el canvas se dibuja al 18% y el navegador lo agranda suavemente

function createAurora(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  host.classList.add('has-ambient');
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let running = false;
  let frame = 0;
  const pointer = { x: 0.3, y: 0.4, tx: 0.3, ty: 0.4, active: false };

  const resize = () => {
    w = Math.max(16, Math.round(host.clientWidth * SCALE));
    h = Math.max(16, Math.round(host.clientHeight * SCALE));
    canvas.width = w;
    canvas.height = h;
    draw(performance.now());
  };

  function draw(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    BLOBS.forEach((b) => {
      let x = 0.5 + 0.38 * Math.sin(t * b.speed[0] * 2 + b.phase[0]);
      let y = 0.5 + 0.34 * Math.cos(t * b.speed[1] * 2 + b.phase[1]);
      if (b.follow && pointer.active) {
        x = x * 0.35 + pointer.x * 0.65;
        y = y * 0.35 + pointer.y * 0.65;
      }
      const r = Math.max(w, h) * b.size * (0.9 + 0.1 * Math.sin(t * 0.6 + b.phase[0]));
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r);
      g.addColorStop(0, `rgba(${b.rgb}, ${b.alpha})`);
      g.addColorStop(1, `rgba(${b.rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  // 30 cuadros por segundo bastan para una luz lenta y ahorran batería.
  let last = 0;
  const loop = (now) => {
    if (now - last > 32) {
      last = now;
      draw(now);
    }
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (running || prefersReducedMotion) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (window.matchMedia('(pointer: fine)').matches) {
    host.addEventListener('pointermove', (event) => {
      const rect = host.getBoundingClientRect();
      pointer.tx = (event.clientX - rect.left) / rect.width;
      pointer.ty = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    });
    host.addEventListener('pointerleave', () => {
      pointer.active = false;
    });
  }
  resize();
}

/* ---------- Limones flotantes ---------- */
function createLemons(host) {
  const layer = document.createElement('div');
  layer.className = 'ambient-lemons';
  layer.setAttribute('aria-hidden', 'true');
  const count = 9;
  layer.innerHTML = Array.from({ length: count }, (_, i) => {
    const size = 34 + ((i * 37) % 70);
    const left = (i / count) * 100 + ((i * 13) % 8);
    const duration = 16 + ((i * 7) % 12);
    const delay = -((i * 5.3) % duration);
    const spin = i % 2 ? 1 : -1;
    return `<svg class="ambient-lemon" style="--size:${size}px;--left:${left}%;--dur:${duration}s;--delay:${delay}s;--spin:${spin}"><use href="#lemon" /></svg>`;
  }).join('');
  host.prepend(layer);
  host.classList.add('has-ambient');
}

/* ---------- Luz sobre la cerámica ---------- */
function initTileGlow() {
  const sections = [...document.querySelectorAll('.tex-ceramica')];
  if (!sections.length) return;
  sections.forEach((s) => s.classList.add('has-tile-glow'));

  if (window.matchMedia('(pointer: fine)').matches) {
    sections.forEach((section) => {
      section.addEventListener('pointermove', (event) => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        section.style.setProperty('--my', `${event.clientY - rect.top}px`);
        section.classList.add('is-lit');
      });
      section.addEventListener('pointerleave', () => section.classList.remove('is-lit'));
    });
    return;
  }

  // Pantallas táctiles: la luz se pasea sola por la sección visible.
  if (prefersReducedMotion) return;
  let visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  });
  sections.forEach((s) => io.observe(s));
  const tick = (now) => {
    const t = now / 1000;
    visible.forEach((section) => {
      const x = (0.5 + 0.4 * Math.sin(t * 0.35)) * section.clientWidth;
      const y = window.scrollY - section.offsetTop + window.innerHeight * (0.5 + 0.3 * Math.cos(t * 0.27));
      section.style.setProperty('--mx', `${x}px`);
      section.style.setProperty('--my', `${y}px`);
      section.classList.add('is-lit');
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
