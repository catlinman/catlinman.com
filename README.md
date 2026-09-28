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

Each `---` divider starts a new panel. A panel that opens with `<!-- year: 2014 -->`, or a range like `<!-- year: 2016 - 2018 -->`, joins a timeline: neighbouring panels with the same year share a sticky year label, and a year rail appears on the right.

`/llms.txt` is generated from the same frontmatter at build time, so new pages show up there on their own.

### Frontmatter

- `navigation` (string): Navigation label for the page. Falls back to `heading`.
- `heading` (string): Page heading, used in the page title.
- `description` (string, optional): Meta description used for SEO and social embeds.
- `order` (number): Used for sorting navigation.
- `hidden` (boolean, optional): Keeps the page out of the navigation. Pages in subfolders never show up there.
- `sections` (array of objects, optional): Entries for the section bar below the navigation. Each has a `name` and the `id` of the heading it jumps to. `top` jumps to the start of the page.
- `gallery` (array of objects, optional): Gallery categories. The page shows every piece in one full width stream sorted by year, newest first, with the categories as toggles in the section bar. Each category has a `name`, an `id` and a list of `items`. `hidden: true` starts a category toggled off. Each item has:
  - `slug` (string): Image file name under `static/img/gallery/`, without the extension
  - `name` (string, optional): Title shown on hover and in the lightbox
  - `year` (string, optional): Shown before the title and used for sorting. A range like `2014/2015` sorts by its last year, and pieces without a year go last.
  - `video` (string, optional): YouTube id. The image then only serves as the poster, and YouTube loads once the video is opened.

### Images

Gallery and project images are WebP. Each one has a full size copy (at most 1920px on the long edge) and a 480x270 thumbnail in a `thumbs/` folder next to it:

```bash
vips thumbnail source.jpg static/img/gallery/slug.webp[Q=82] 1920 --height 1920 --size down
vips thumbnail source.jpg static/img/gallery/thumbs/slug.webp[Q=78] 480 --height 270 --crop centre
```

Any link in page content with a `data-lightbox` attribute opens in the lightbox, grouped with the other links that share its value. Add `data-video` with a YouTube id for videos.

### Building blocks

Pages are markdown with some raw HTML for layout:

- `<header class="hero" style="--hero: url('/img/heroes/name.webp')">` opens a panel with its key image as a banner and the `<h1>` over it. Leave out the style for a plain heading. `--hero-pos` moves the focal point, for example `--hero-pos: center 70%`.
- `<a class="hero-open" href="..." data-lightbox="hero-name">` inside a hero puts a button in its corner that opens the full image. Add the `play` class and `data-video` for a video.
- `<div class="media">` holds tiles in an even grid under a hero.
- `<div class="actions">` holds `<a class="button">` links. Links that leave the site get an arrow.
- `<div class="chips">` holds small `<span class="chip">` or `<a class="chip">` labels.
- `<a class="embed" href="..." data-embed="youtube-id"><img src="poster"></a>` shows a video poster in place that turns into the player when clicked.

### Games

`static/games/` holds old browser games as they were built, served as plain files. Link to their `index.html` directly with `data-sveltekit-reload`, since they aren't SvelteKit pages.
