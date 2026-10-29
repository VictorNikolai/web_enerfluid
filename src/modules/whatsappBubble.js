/** Burbuja de ayuda junto al botón de WhatsApp. Aparece una vez por visita. */
const KEY = 'sm-wa-bubble-closed';

function wasClosed() {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function initWhatsappBubble(delay = 9000) {
  const bubble = document.querySelector('[data-wa-bubble]');
  if (!bubble || wasClosed()) return;

  const close = () => {
    bubble.classList.remove('is-visible');
    setTimeout(() => (bubble.hidden = true), 300);
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* Sin almacenamiento: solo se oculta en esta vista. */
    }
  };

  setTimeout(() => {
    if (wasClosed()) return;
    bubble.hidden = false;
    requestAnimationFrame(() => bubble.classList.add('is-visible'));
  }, delay);

  bubble.querySelector('[data-wa-bubble-close]').addEventListener('click', close);
  document.querySelector('.whatsapp-float')?.addEventListener('click', close);
}
