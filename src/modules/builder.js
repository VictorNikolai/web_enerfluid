import { whatsappLink } from '../config.js';
import data from '../data/mercado.json';
import { escapeHtml } from '../utils/format.js';
import { gsap, prefersReducedMotion } from './motion.js';

/**
 * "Separa tu puesto": la persona elige rubro, cantidad y plazo; el mensaje de
 * WhatsApp se escribe solo y queda listo para enviar. No se guarda ningún dato.
 */
export function initBuilder() {
  const form = document.querySelector('[data-builder]');
  if (!form) return;
  const preview = form.querySelector('[data-preview]');
  const send = form.querySelector('[data-builder-send]');
  const qtyOut = form.querySelector('[data-qty]');
  const state = { rubro: data.rubros[0].name, qty: 1, timing: data.timing[0].value };

  form.querySelector('[data-rubros]').innerHTML = data.rubros
    .map(
      (r, i) => `<input type="radio" name="rubro" id="rubro-${i}" value="${escapeHtml(r.name)}"${i === 0 ? ' checked' : ''} />
        <label for="rubro-${i}">${r.icon ? `<i class="${r.icon}" aria-hidden="true"></i> ` : ''}${escapeHtml(r.name)}</label>`,
    )
    .join('');
  form.querySelector('[data-timing]').innerHTML = data.timing
    .map(
      (t, i) => `<input type="radio" name="timing" id="timing-${i}" value="${escapeHtml(t.value)}"${i === 0 ? ' checked' : ''} />
        <label for="timing-${i}">${escapeHtml(t.label)}</label>`,
    )
    .join('');

  const message = () => {
    const rubro = state.rubro === 'Otro rubro' ? 'mi negocio' : state.rubro.toLowerCase();
    const puestos = state.qty === 1 ? 'un puesto' : `${state.qty} puestos`;
    return `Hola Mercado San Martín, vengo de la web. Me interesa ${puestos} para ${rubro}. ${state.timing} ¿Me envían los puestos disponibles?`;
  };

  // Efecto de escritura: conserva lo que no cambió y "teclea" el resto.
  let shown = '';
  let typing = null;
  function update() {
    const text = message();
    send.href = whatsappLink('ventas', text);
    typing?.kill();
    if (prefersReducedMotion) {
      preview.textContent = shown = text;
      return;
    }
    let same = 0;
    while (same < shown.length && same < text.length && shown[same] === text[same]) same += 1;
    const counter = { n: same };
    typing = gsap.to(counter, {
      n: text.length,
      duration: Math.min(1.2, (text.length - same) * 0.018 + 0.1),
      ease: 'none',
      onUpdate: () => {
        preview.textContent = text.slice(0, Math.round(counter.n));
      },
      onComplete: () => {
        shown = text;
      },
    });
    shown = text.slice(0, same);
  }

  form.addEventListener('change', (event) => {
    if (event.target.name === 'rubro') state.rubro = event.target.value;
    if (event.target.name === 'timing') state.timing = event.target.value;
    update();
  });
  form.querySelectorAll('[data-step]').forEach((button) =>
    button.addEventListener('click', () => {
      state.qty = Math.min(10, Math.max(1, state.qty + Number(button.dataset.step)));
      qtyOut.textContent = state.qty;
      if (!prefersReducedMotion) gsap.fromTo(qtyOut, { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
      update();
    }),
  );

  // Desde la sección de rubros: "Quiero este rubro" lo deja elegido aquí.
  document.addEventListener('rubro:pick', (event) => {
    const input = [...form.querySelectorAll('input[name="rubro"]')].find((i) => i.value === event.detail);
    if (!input) return;
    input.checked = true;
    state.rubro = input.value;
    update();
    if (!prefersReducedMotion) gsap.fromTo(input.nextElementSibling, { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'back.out(3)', delay: 0.6 });
  });

  preview.textContent = shown = message();
  send.href = whatsappLink('ventas', shown);
}
