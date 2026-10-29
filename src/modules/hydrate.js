import { config, directionsLink, whatsappLink } from '../config.js';
import { escapeHtml } from '../utils/format.js';

/** Llena enlaces y textos de contacto a partir de src/data/site.json. */
export function hydrateContactData() {
  document.querySelectorAll('[data-wa]').forEach((el) => {
    el.href = whatsappLink(el.dataset.wa);
  });

  const hrefBuilders = {
    tel: () => `tel:${config.phone.replace(/[^\d+]/g, '')}`,
    mailto: () => `mailto:${config.email}`,
    directions: directionsLink,
  };

  document.querySelectorAll('[data-config]').forEach((el) => {
    const value = config[el.dataset.config];
    if (value === undefined) return;
    // Conserva un icono si el elemento ya trae uno.
    const icon = el.querySelector('i');
    el.textContent = value;
    if (icon) el.prepend(icon, ' ');
  });

  document.querySelectorAll('[data-config-href]').forEach((el) => {
    const build = hrefBuilders[el.dataset.configHref];
    if (build) el.href = build();
  });

  // Redes: si aún no hay enlace propio, el ícono abre la búsqueda del mercado en esa red.
  const networks = [
    ...config.socials,
    { name: 'WhatsApp', icon: 'ri-whatsapp-line', url: whatsappLink('atencion') },
  ];
  document.querySelectorAll('[data-socials]').forEach((list) => {
    list.innerHTML = networks
      .map(
        (s) => `<li><a class="social social--${escapeHtml(s.name.toLowerCase())}" href="${escapeHtml(s.url || s.search)}" target="_blank" rel="noopener" aria-label="${escapeHtml(s.name)}" title="${escapeHtml(s.name)}">
          <i class="${escapeHtml(s.icon)}" aria-hidden="true"></i></a></li>`,
      )
      .join('');
  });

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
