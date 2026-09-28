import type { ContentData, Frontmatter, NavItem } from '$types/Content'
import fs from 'node:fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit'
import matter from 'gray-matter'
import { marked } from 'marked'

const contentDir = path.resolve('content')

// Headings take an explicit anchor as `# Heading {#anchor}`, which keeps the
// short anchors the old site used instead of slugging the heading text.
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      const match = text.match(/\s*\{#([\w-]+)\}\s*$/)

      if (!match)
        return `<h${depth}>${text}</h${depth}>\n`

      return `<h${depth} id="${match[1]}">${text.slice(0, match.index)}</h${depth}>\n`
    },
  },
})

export async function loadContent(slug: string): Promise<ContentData> {
  const mdPath = path.join(contentDir, `${slug}.md`)

  let raw
  try {
    raw = await fs.readFile(mdPath, 'utf-8')
  }
  catch {
    throw error(404, 'Markdown file not found')
  }

  const { data, content } = matter(raw)
  const html = await marked.parse(content)

  return { html, frontmatter: data as Frontmatter }
}

export async function loadNavItems(): Promise<NavItem[]> {
  const files = await fs.readdir(contentDir)
  const navItems: NavItem[] = []

  for (const file of files) {
    if (!file.endsWith('.md'))
      continue

    const raw = await fs.readFile(path.join(contentDir, file), 'utf-8')
    const { data } = matter(raw)

    // Skip hidden items in navigation
    if (data.hidden === true)
      continue

    navItems.push({
      slug: file.replace(/\.md$/, ''),
      heading: data.heading ?? '',
      navigation: data.navigation ?? '',
      order: data.order ?? 999,
    })
  }

  navItems.sort((a, b) => a.order - b.order)

  return navItems
}

// Every markdown file under content/ becomes a page, nested folders included.
export async function listSlugs(dir = contentDir): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const slugs: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory())
      slugs.push(...await listSlugs(full))
    else if (entry.name.endsWith('.md'))
      slugs.push(path.relative(contentDir, full).replace(/\.md$/, ''))
  }

  return slugs
}
