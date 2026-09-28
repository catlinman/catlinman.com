import { listSlugs } from '$lib/server/loadContent'

export const prerender = true
export const trailingSlash = 'never'

const SITE = 'https://catlinman.com'

export async function GET() {
  const paths = ['/', ...(await listSlugs()).sort().map(slug => `/${slug}/`)]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(p => `  <url><loc>${SITE}${p}</loc></url>`),
    '</urlset>',
    '',
  ]

  return new Response(xml.join('\n'), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
