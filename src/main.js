// Fuentes alojadas en la propia web (sin depender de Google Fonts).
import '@fontsource-variable/jost/wght.css';
import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource/anton/latin-400.css';
import './styles/icons.css';
import './styles/main.css';

import { hydrateContactData } from './modules/hydrate.js';
import { initSmoothScroll } from './modules/smoothScroll.js';
import { initHeader } from './modules/header.js';
import { initHeroVideo } from './modules/heroVideo.js';
import { initStory } from './modules/story.js';
import { initTour } from './modules/tour.js';
import { initStall } from './modules/stall.js';
import { initBuilder } from './modules/builder.js';
import { initEvents } from './modules/eventGallery.js';
import { initAccordion } from './modules/accordion.js';
import { initWhatsappBubble } from './modules/whatsappBubble.js';
import { initMap } from './modules/map.js';
import { initCompare, initFinalTitle, initFounders, initRenders, initRise, initRotator, initSpecs, initTrades, initWhy } from './modules/presentation.js';
import { initPlan } from './modules/plan.js';
import { initInvest } from './modules/invest.js';
import { initBrochure } from './modules/brochure.js';
import { playIntro } from './animations/intro.js';
import { initCursor, initMarqueeMotion, initShutterReveal, initTilt } from './animations/interactions.js';
import { initAmbient } from './animations/ambient.js';
import { initFooterMark, initHeroScroll, initMagnetic, initToTop } from './animations/polish.js';
import {
  initCounters,
  initMarquee,
  initParallax,
  initScrollProgress,
  initStaggerLists,
  initStepsLine,
  initTitleReveal,
} from './animations/scrollEffects.js';

initWhy();
initTrades();
initSpecs();
initRenders();
initInvest();
initBrochure();
hydrateContactData();
initSmoothScroll();
initMarquee();

const heroVideo = initHeroVideo();
initRotator();
initCompare();
initStory();
initTour();
// Después del recorrido: el fijado cambia las posiciones de las secciones siguientes.
initHeader();
initStall();
initPlan();
initBuilder();
initEvents();
initAccordion();
initWhatsappBubble();
initMap();

initCounters();
initParallax();
initTitleReveal();
initStaggerLists();
initStepsLine();
initScrollProgress();
initAmbient();
initHeroScroll();
initMagnetic();
initToTop();
initFooterMark();
initFinalTitle();
initFounders();
initRise();
initShutterReveal();
initTilt();
initCursor();
initMarqueeMotion();

// Espera a las fuentes para que el titular no salte durante la animación.
document.fonts.ready.then(() => playIntro(heroVideo.play));
