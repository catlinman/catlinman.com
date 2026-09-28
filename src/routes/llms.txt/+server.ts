import { loadPages } from '$lib/server/loadContent'

export const prerender = true
export const trailingSlash = 'never'

const SITE = 'https://catlinman.com'

// Follows the llms.txt proposal (https://llmstxt.org), built from the content
// frontmatter so new pages show up without touching this file.
export async function GET() {
  const pages = (await loadPages()).sort((a, b) => a.slug.localeCompare(b.slug))

  const lines = [
    '# Catlinman',
    '',
    '> The website of Catlinman, an online handle used by an artist, animator and programmer from 2013 until it was retired in 2020. The site is kept as a time capsule of that era. The same person continues as zealsprince at https://zealsprince.com.',
    '',
    '## Pages',
    '',
    ...pages.map(page => `- [${page.heading ?? page.slug}](${SITE}/${page.slug}/)${page.description ? `: ${page.description}` : ''}`),
    '',
    '## Elsewhere',
    '',
    '- [zealsprince.com](https://zealsprince.com): Current website',
    '- [GitHub](https://github.com/catlinman): Open source work from the Catlinman era',
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
