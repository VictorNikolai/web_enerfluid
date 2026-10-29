/**
 * Configuración de la web.
 * Los datos del negocio (teléfono, dirección, horario, redes, coordenadas)
 * están en src/data/site.json: edítalos ahí y se actualizan en toda la web,
 * en Google (datos estructurados) y en la app instalable.
 */
import site from './data/site.json';

const withBase = (path) => {
  const base = import.meta.env.BASE_URL || '/';
  if (!path) return path;
  if (path.startsWith(base)) return path;
  if (path.startsWith('/')) return `${base}${path.slice(1)}`;
  return `${base}${path}`;
};

export const config = {
  company: site.name,
  site,

  // Mensajes de WhatsApp por canal (el número viene de site.json).
  whatsapp: {
    ventas: 'Hola Mercado San Martín, vengo de la web y quisiera información para separar un puesto.',
    atencion: 'Hola Mercado San Martín, vengo de la web y necesito ayuda.',
    visitas: 'Hola Mercado San Martín, quisiera agendar una visita para conocer los puestos.',
  },

  phone: site.phone,
  email: site.email,
  address: site.address.display,
  reference: site.address.reference,
  hours: site.hours.display,
  geo: site.geo,
  socials: site.socials,

  // Videos (carpeta public/video/). El de portada va sin audio y en bucle.
  heroVideo: withBase('/video/mercado-loop.mp4'),
  fullVideo: withBase('/video/mercado-san-martin.mp4'),
  videoPoster: withBase('/img/mercado/video-poster-1800.webp'),

  // URL de la API (FastAPI). En producción se define en el archivo .env (VITE_API_URL).
};

export function whatsappLink(channel = 'ventas', customText) {
  const text = customText ?? config.whatsapp[channel] ?? config.whatsapp.ventas;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function directionsLink() {
  const { lat, lng } = site.geo;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
