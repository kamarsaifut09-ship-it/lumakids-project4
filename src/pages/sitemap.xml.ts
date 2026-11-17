import type { APIRoute } from 'astro';

const paths = ['/', '/catalog/', '/production/', '/wholesale/', '/contact/'];

export const GET: APIRoute = ({ site }) => {
  const urls = paths.map((path) => {
    const location = site ? new URL(path, site).href : path;
    return `  <url><loc>${location}</loc></url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
