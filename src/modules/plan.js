import plano from '../data/plano.json';
import { whatsappLink } from '../config.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

/*
 * Plano interactivo de los 184 puestos (12 pabellones, A a L).
 * Se dibuja en SVG con las posiciones del plano del brochure (src/data/plano.json).
 * Tocar un puesto muestra sus datos y arma el mensaje de WhatsApp para ese puesto.
 * Para marcar puestos separados o vendidos, edita "separados" y "vendidos" en plano.json.
 */
const NS = 'http://www.w3.org/2000/svg';
const pad = (n) => String(n).padStart(2, '0');
const el = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
};

/** Numeración del plano: en pabellones dobles, pares a la izquierda e impares a la derecha. */
function stallsOf(p) {
  const list = [];
  const cellW = p.cols === 1 ? 40 : 40;
  for (let r = 0; r < p.rows; r += 1) {
    for (let c = 0; c < p.cols; c += 1) {
      const number = p.cols === 1 ? r + 1 : r * 2 + (c === 0 ? 2 : 1);
      list.push({ code: `${p.id}-${pad(number)}`, pab: p.id, number, x: p.x + c * cellW, y: p.y + r * p.rowH, w: cellW, h: p.rowH });
    }
  }
  return list;
}

export function initPlan() {
  const svg = document.querySelector('[data-plan]');
  if (!svg) return;
  const card = document.querySelector('[data-plan-card]');
  const code = card.querySelector('[data-plan-code]');
  const status = card.querySelector('[data-plan-status]');
  const send = card.querySelector('[data-plan-send]');
  const selPab = card.querySelector('[data-plan-select-pab]');
  const selNum = card.querySelector('[data-plan-select-num]');
  const filters = document.querySelector('[data-plan-filters]');
  const sold = new Set(plano.vendidos);
  const held = new Set(plano.separados);

  // Edificio, pasaje y baños
  svg.append(
    el('polygon', { points: plano.outline, class: 'plan-floor' }),
    el('rect', { x: plano.pasaje.x, y: plano.pasaje.y, width: plano.pasaje.w, height: plano.pasaje.h, class: 'plan-aisle' }),
  );
  const aisleText = el('text', {
    x: plano.pasaje.x + plano.pasaje.w / 2,
    y: plano.pasaje.y + plano.pasaje.h / 2,
    class: 'plan-aisle-label',
    transform: `rotate(-90 ${plano.pasaje.x + plano.pasaje.w / 2} ${plano.pasaje.y + plano.pasaje.h / 2})`,
  });
  aisleText.textContent = 'Pasaje principal · 5.50 m';
  svg.append(aisleText);
  plano.banos.forEach((b) => {
    svg.append(el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, class: 'plan-wc' }));
    const t = el('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + 3.5, class: 'plan-wc-label' });
    t.textContent = b.label.replace('SS.HH. ', '');
    svg.append(t);
  });

  // Pabellones y puestos
  const all = [];
  const groups = {};
  plano.pabellones.forEach((p) => {
    const g = el('g', { class: 'plan-pab', 'data-pab': p.id });
    const stalls = stallsOf(p);
    stalls.forEach((s) => {
      const cell = el('g', { class: 'plan-stall', 'data-code': s.code });
      if (sold.has(s.code)) cell.classList.add('is-sold');
      else if (held.has(s.code)) cell.classList.add('is-held');
      cell.append(el('rect', { x: s.x + 1.5, y: s.y + 1.5, width: s.w - 3, height: s.h - 3, rx: 4 }));
      const t = el('text', { x: s.x + s.w / 2, y: s.y + s.h / 2 + 4 });
      t.textContent = s.number;
      cell.append(t);
      g.append(cell);
      all.push({ ...s, node: cell });
    });
    // Letra del pabellón
    const [lx, ly] = p.label ?? [p.x + (p.cols * 40) / 2, p.y - 14];
    const badge = el('g', { class: 'plan-badge' });
    badge.append(el('circle', { cx: lx, cy: ly, r: 11 }));
    const bt = el('text', { x: lx, y: ly + 4.5 });
    bt.textContent = p.id;
    badge.append(bt);
    g.append(badge);
    svg.append(g);
    groups[p.id] = { node: g, stalls };
  });

  // Filtros por pabellón
  filters.innerHTML = ['Todos', ...plano.pabellones.map((p) => p.id)]
    .map((id, i) => `<button type="button" class="plan-filter${i === 0 ? ' is-active' : ''}" data-pab="${id === 'Todos' ? '' : id}" aria-pressed="${i === 0}">${id === 'Todos' ? 'Todos' : `Pabellón ${id}`}</button>`)
    .join('');
  filters.addEventListener('click', (event) => {
    const b = event.target.closest('[data-pab]');
    if (!b) return;
    highlight(b.dataset.pab);
    if (b.dataset.pab) select(groups[b.dataset.pab].stalls[0].code);
  });
  function highlight(id) {
    filters.querySelectorAll('[data-pab]').forEach((b) => {
      const on = b.dataset.pab === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    svg.classList.toggle('has-focus', Boolean(id));
    Object.entries(groups).forEach(([k, g]) => g.node.classList.toggle('is-focus', k === id));
  }

  // Selectores accesibles (teclado y lectores de pantalla)
  selPab.innerHTML = plano.pabellones.map((p) => `<option value="${p.id}">${p.id}</option>`).join('');
  const fillNumbers = (pab) => {
    selNum.innerHTML = groups[pab].stalls
      .slice()
      .sort((a, b) => a.number - b.number)
      .map((s) => `<option value="${s.code}">${pad(s.number)}</option>`)
      .join('');
  };
  selPab.addEventListener('change', () => {
    fillNumbers(selPab.value);
    select(selNum.value);
  });
  selNum.addEventListener('change', () => select(selNum.value));

  let current = null;
  function select(stallCode, animate = true) {
    const s = all.find((x) => x.code === stallCode);
    if (!s) return;
    current?.node.classList.remove('is-selected');
    s.node.classList.add('is-selected');
    current = s;
    code.textContent = s.code;
    if (selPab.value !== s.pab) {
      selPab.value = s.pab;
      fillNumbers(s.pab);
    }
    selNum.value = s.code;
    const state = sold.has(s.code) ? 'vendido' : held.has(s.code) ? 'separado' : null;
    status.textContent = state
      ? `Este puesto ya está ${state}. Pregúntanos por otros cercanos.`
      : 'Consulta la disponibilidad por WhatsApp.';
    send.href = whatsappLink(
      'ventas',
      `Hola Mercado San Martín, vi el plano en la web y me interesa el puesto ${s.code} (pabellón ${s.pab}, 5 m²). ¿Está disponible?`,
    );
    if (animate && !prefersReducedMotion) {
      gsap.fromTo(code, { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out' });
      gsap.fromTo(s.node.querySelector('rect'), { scale: 1.35, transformOrigin: 'center', transformBox: 'fill-box' }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
    }
  }

  svg.addEventListener('click', (event) => {
    const cell = event.target.closest('.plan-stall');
    if (cell) select(cell.dataset.code);
  });

  select('C-07', false);

  // Entrada: los puestos aparecen en ola, pabellón por pabellón.
  if (prefersReducedMotion) return;
  const rects = [...svg.querySelectorAll('.plan-stall')];
  gsap.set(rects, { autoAlpha: 0, scale: 0.4, transformOrigin: 'center', transformBox: 'fill-box' });
  ScrollTrigger.create({
    trigger: svg,
    start: 'top 75%',
    once: true,
    onEnter: () =>
      gsap.to(rects, {
        autoAlpha: 1,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: { each: 0.004, from: 'start' },
        clearProps: 'transform,opacity,visibility',
      }),
  });
}
