import data from '../data/mercado.json';
import { escapeHtml } from '../utils/format.js';
import { picture } from '../utils/media.js';
import { ScrollTrigger, prefersReducedMotion } from './motion.js';

/** "De terreno a mercado": la línea roja avanza con el scroll y cada etapa se colorea. */
export function initStory() {
  const list = document.querySelector('[data-story]');
  if (!list) return;

  list.innerHTML = data.story
    .map(
      (step, i) => `
      <li class="story-step">
        <span class="story-num">${i + 1}</span>
        <div class="story-img">
          ${picture(step.src, { alt: `${step.title}: ${step.caption}`, sizes: '(max-width: 860px) 50vw, 25vw', w: 480 })}
        </div>
        <h4>${escapeHtml(step.title)}</h4>
        <p>${escapeHtml(step.caption)}</p>
      </li>`,
    )
    .join('');

  const steps = [...list.children];
  const light = (progress) => {
    list.style.setProperty('--line-progress', progress.toFixed(3));
    steps.forEach((step, i) => step.classList.toggle('is-on', progress >= i / (steps.length - 1) - 0.02));
  };

  if (prefersReducedMotion) return light(1);
  ScrollTrigger.create({
    trigger: list,
    start: 'top 80%',
    end: 'bottom 45%',
    scrub: 0.6,
    onUpdate: ({ progress }) => light(progress),
  });
}
