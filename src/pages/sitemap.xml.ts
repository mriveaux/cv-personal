import type { APIRoute } from 'astro';
import { SITE_URL } from '../site';
import { LANGS, getLocalizedPath } from '../i18n/langs';

export const GET: APIRoute = () => {
  const urls = LANGS.map((lang) => `${SITE_URL}${getLocalizedPath(lang)}`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
