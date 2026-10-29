import { config, directionsLink, whatsappLink } from '../config.js';
import { isPreview } from '../utils/env.js';
import { escapeHtml } from '../utils/format.js';

/*
 * Mapa de ubicación con Leaflet + OpenStreetMap (gratis, sin clave de API).
 * Leaflet se descarga recién cuando la sección de contacto se acerca a la pantalla.
 * La posición sale de src/data/site.json → geo.
 */
export function initMap() {
  const box = document.querySelector('[data-map]');
  if (!box) return;

  const { site } = config;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`;

  // La vista previa de Claude no permite cargar mapas externos: acceso directo.
  if (isPreview) {
    box.replaceWith(
      Object.assign(document.createElement('a'), {
        className: 'map-fallback',
        href: mapsUrl,
        target: '_blank',
        rel: 'noopener',
        innerHTML: `<i class="ri-map-2-line" aria-hidden="true"></i><strong>Ver en el mapa</strong><span>${escapeHtml(site.address.display)}</span>`,
      }),
    );
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      build(box, site).catch(() => {
        box.innerHTML = `<a class="map-fallback" href="${mapsUrl}" target="_blank" rel="noopener"><i class="ri-map-2-line" aria-hidden="true"></i><strong>Ver en el mapa</strong></a>`;
      });
    },
    { rootMargin: '600px 0px' },
  );
  observer.observe(box);
}

async function build(box, site) {
  const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
  const center = [site.geo.lat, site.geo.lng];
  const touch = matchMedia('(pointer: coarse)').matches;

  const map = L.map(box, {
    center,
    zoom: 16,
    scrollWheelZoom: false, // no "atrapa" la rueda mientras la persona baja por la página
    dragging: !touch, // en celular se arrastra la página, no el mapa (se usan los botones +/−)
    tap: false,
    zoomControl: true,
    attributionControl: true,
  });
  map.attributionControl.setPrefix(false);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);

  const pin = L.divIcon({
    className: 'map-pin',
    html: '<span class="map-pin-dot"><img src="/favicon.png" alt="" width="28" height="28" /></span><span class="map-pin-pulse"></span>',
    iconSize: [56, 56],
    iconAnchor: [28, 52],
    popupAnchor: [0, -50],
  });

  const popup = `
    <div class="map-popup">
      <strong>${escapeHtml(site.name)}</strong>
      <span>${escapeHtml(site.address.display)}</span>
      <span class="map-popup-hours"><i class="ri-time-line" aria-hidden="true"></i> ${escapeHtml(site.hours.display)}</span>
      <div class="map-popup-actions">
        <a href="${directionsLink()}" target="_blank" rel="noopener"><i class="ri-direction-line" aria-hidden="true"></i> Cómo llegar</a>
        <a href="${whatsappLink('visitas')}" target="_blank" rel="noopener" class="is-wa"><i class="ri-whatsapp-line" aria-hidden="true"></i> Agendar visita</a>
      </div>
    </div>`;

  L.marker(center, { icon: pin, title: site.name, alt: site.name, keyboard: true })
    .addTo(map)
    .bindPopup(popup, { maxWidth: 260, closeButton: true, autoPanPadding: [24, 24] })
    .openPopup();

  // Mapa angosto: bajamos el pin para que la ficha no lo tape.
  if (box.clientWidth < 600) map.panBy([0, -box.clientHeight * 0.24], { animate: false });

  // En pantallas táctiles: un toque activa el arrastre del mapa.
  if (touch) {
    map.once('click', () => map.dragging.enable());
  }
  box.classList.add('is-ready');
}
