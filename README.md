# catlinman.com

The website of Catlinman, a handle I retired in 2020. It keeps the look the site had from 2017 on, rebuilt as a static SvelteKit site. You can find me at [zealsprince.com](https://zealsprince.com) now.

## Development

Requires Node.js.

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Project Structure

```text
content/         # Markdown content files, nested folders become nested pages
src/             # Source code
  components/    # Svelte components
  lib/           # Content loading, table handling and the header quotes
  routes/        # SvelteKit routes
  scenes/        # Background scene
  types/         # TypeScript types
static/          # Static assets (images, favicon, robots.txt)
```

## Content

Every markdown file in `content/` becomes a page at the same path, so `content/about/setup.md` is served at `/about/setup/`. Raw HTML passes through, which the pages use for tables and the layout classes from the original site.

Headings take an explicit anchor with `# Heading {#anchor}`.

### Frontmatter

- `navigation` (string): Navigation label for the page. Falls back to `heading`.
- `heading` (string): Page heading, used in the page title.
- `description` (string, optional): Meta description used for SEO and social embeds.
- `order` (number): Used for sorting navigation.
- `hidden` (boolean, optional): Keeps the page out of the navigation. Pages in subfolders never show up there.
- `sections` (array of objects, optional): Entries for the section bar below the navigation. Each has a `name` and the `id` of the heading it jumps to. `top` jumps to the start of the page.
