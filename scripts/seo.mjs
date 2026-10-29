/**
 * Plugin de Vite para el SEO local del mercado.
 *  - Inserta en index.html: canonical, Open Graph, Twitter y datos estructurados
 *    (schema.org ShoppingCenter) a partir de src/data/site.json.
 *  - Genera robots.txt y sitemap.xml al compilar.
 * La URL pública sale de VITE_SITE_URL (archivo .env) o de site.json.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function seoPlugin(env = {}) {
  const site = JSON.parse(readFileSync(join(root, 'src/data/site.json'), 'utf8'));
  const url = (env.VITE_SITE_URL || site.url).replace(/\/$/, '');
  const ogImage = `${url}/og-image.jpg`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ShoppingCenter',
    '@id': `${url}/#mercado`,
    name: site.name,
    slogan: site.tagline,
    description: site.description,
    url: `${url}/`,
    image: [ogImage, `${url}/img/mercado/aereo-cerros-1800.webp`],
    logo: `${url}/img/logo-mercado-san-martin.png`,
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street.startsWith('PENDIENTE') ? undefined : site.address.street,
      addressLocality: `${site.address.district}, ${site.address.city}`,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: site.hours.days,
      opens: site.hours.opens,
      closes: site.hours.closes,
    }],
    amenityFeature: [
      'Puestos con altillo',
      'Estacionamiento',
      'Detectores de humo',
      'Rociadores contra incendios',
      'Servicios higiénicos',
    ].map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    sameAs: site.socials.map((s) => s.url).filter(Boolean),
  };

  const tags = [
    { tag: 'link', attrs: { rel: 'canonical', href: `${url}/` } },
    { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
    { tag: 'meta', attrs: { property: 'og:locale', content: 'es_PE' } },
    { tag: 'meta', attrs: { property: 'og:site_name', content: site.name } },
    { tag: 'meta', attrs: { property: 'og:url', content: `${url}/` } },
    { tag: 'meta', attrs: { property: 'og:title', content: `${site.name} · ${site.address.district}` } },
    { tag: 'meta', attrs: { property: 'og:description', content: site.description } },
    { tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
    { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
    { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
    { tag: 'meta', attrs: { property: 'og:image:alt', content: `${site.name}: ${site.tagline}` } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'geo.region', content: 'PE-LIM' } },
    { tag: 'meta', attrs: { name: 'geo.placename', content: site.address.display } },
    { tag: 'meta', attrs: { name: 'geo.position', content: `${site.geo.lat};${site.geo.lng}` } },
    { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(schema), injectTo: 'head' },
  ];

  return {
    name: 'mercado-seo',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // Solo la página principal.
        if (ctx.filename && !ctx.filename.endsWith('index.html')) return html;
        return { html, tags: tags.map((t) => ({ injectTo: 'head', ...t })) };
      },
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`,
      });
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${url}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${url}/img/mercado/aereo-cerros-1800.webp</image:loc></image:image>
    <image:image><image:loc>${url}/img/mercado/pasillo-central-1800.webp</image:loc></image:image>
    <image:image><image:loc>${url}/img/mercado/puesto-interior-1800.webp</image:loc></image:image>
  </url>
</urlset>
`,
      });
    },
  };
}
