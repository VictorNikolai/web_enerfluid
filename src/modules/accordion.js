/** Preguntas frecuentes: abre una respuesta a la vez. La animación de altura vive en CSS. */
export function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    accordion.addEventListener('click', (event) => {
      const trigger = event.target.closest('.acc-trigger');
      if (!trigger) return;
      const opening = trigger.getAttribute('aria-expanded') !== 'true';
      accordion.querySelectorAll('.acc-trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
      trigger.setAttribute('aria-expanded', String(opening));
    });
  });
}
