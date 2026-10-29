import { config } from '../config.js';
import { prefersReducedMotion } from './motion.js';
import { lockScroll } from './smoothScroll.js';

/**
 * Video de la portada (sin audio, en bucle) y video completo con sonido en un modal.
 * Con "reducir movimiento" activado el video no se reproduce solo: se ve la imagen fija.
 */
export function initHeroVideo() {
  const hero = document.querySelector('[data-hero]');
  const video = hero?.querySelector('[data-hero-video]');
  const pause = hero?.querySelector('[data-hero-pause]');
  if (!video) return { play() {} };

  hero.style.backgroundImage = `url('${config.videoPoster}')`;
  video.poster = config.videoPoster;
  if (config.heroVideo) video.src = config.heroVideo;
  else video.remove();

  let userPaused = prefersReducedMotion;
  let visible = true;

  const setIcon = () => {
    const paused = video.paused;
    pause.setAttribute('aria-label', paused ? 'Reproducir video' : 'Pausar video');
    pause.innerHTML = `<i class="${paused ? 'ri-play-line' : 'ri-pause-line'}" aria-hidden="true"></i>`;
  };
  const tryPlay = () => {
    if (userPaused || !visible || !config.heroVideo) return;
    video.play().catch(() => {}).finally(setIcon);
  };

  pause.addEventListener('click', () => {
    userPaused = !video.paused;
    if (userPaused) video.pause();
    else tryPlay();
    setIcon();
  });
  video.addEventListener('play', setIcon);
  video.addEventListener('pause', setIcon);

  // Ahorra batería: pausa el video cuando la portada no está en pantalla.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) tryPlay();
    else video.pause();
  }).observe(hero);

  initVideoModal(() => video.pause(), tryPlay);
  setIcon();
  return { play: tryPlay };
}

function initVideoModal(onOpen, onClose) {
  const dialog = document.querySelector('[data-video-modal]');
  const full = dialog?.querySelector('[data-video-full]');
  if (!dialog || !config.fullVideo) {
    document.querySelectorAll('[data-video-open]').forEach((b) => b.remove());
    return;
  }
  full.poster = config.videoPoster;
  let opener = null;

  document.querySelectorAll('[data-video-open]').forEach((button) =>
    button.addEventListener('click', () => {
      opener = button;
      if (!full.src) full.src = config.fullVideo;
      onOpen();
      dialog.showModal();
      lockScroll(true);
      full.play().catch(() => {});
    }),
  );
  dialog.querySelector('[data-video-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    full.pause();
    lockScroll(false);
    onClose();
    opener?.focus({ preventScroll: true });
  });
}
