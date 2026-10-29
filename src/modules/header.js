import { ScrollTrigger } from './motion.js';
import { lockScroll } from './smoothScroll.js';

export function initHeader() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  // Fondo sólido al bajar de la portada.
  const updateScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', updateScrolled, { passive: true });
  updateScrolled();

  // Menú móvil.
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    header.classList.toggle('menu-open', open);
    lockScroll(open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', () => setOpen(false));

  // Marca el enlace de la sección visible.
  const links = [...document.querySelectorAll('[data-nav]')];
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: ({ isActive }) => {
        if (!isActive) return link.removeAttribute('aria-current');
        links.forEach((l) => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      },
    });
  });
}
