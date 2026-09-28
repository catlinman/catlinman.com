import type { ContentData, Frontmatter, NavItem } from '$types/Content'
import type { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { error } from '@sveltejs/kit'
import matter from 'gray-matter'
import { marked } from 'marked'

const contentDir = path.resolve('content')
const galleryThumbs = path.resolve('static/img/gallery/thumbs')

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
  const frontmatter = data as Frontmatter

  // Masonry tiles need the thumbnail size up front so the layout doesn't jump
  // while the images load
  for (const section of frontmatter.gallery ?? []) {
    for (const item of section.items) {
      const size = webpSize(await fs.readFile(path.join(galleryThumbs, `${item.slug}.webp`)))

      item.width = size.width
      item.height = size.height
    }
  }

  return { html, frontmatter }
}

// Reads the canvas size from the header of the three WebP flavours vips writes
function webpSize(buffer: Buffer): { width: number, height: number } {
  const chunk = buffer.toString('ascii', 12, 16)

  if (chunk === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    }
  }

  if (chunk === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(26) & 0x3FFF,
      height: buffer.readUInt16LE(28) & 0x3FFF,
    }
  }

  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21)

    return {
      width: 1 + (bits & 0x3FFF),
      height: 1 + ((bits >> 14) & 0x3FFF),
    }
  }

  throw new Error(`Unrecognised WebP chunk ${chunk}`)
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

export async function loadPages(): Promise<Array<{ slug: string } & Frontmatter>> {
  const slugs = await listSlugs()

  return Promise.all(slugs.map(async (slug) => {
    const raw = await fs.readFile(path.join(contentDir, `${slug}.md`), 'utf-8')

    return { slug, ...matter(raw).data }
  }))
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
