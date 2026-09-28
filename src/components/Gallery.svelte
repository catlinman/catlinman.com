<script lang="ts">
  import type { GalleryItem, GallerySection } from '$types/Content'
  import YearRail, { yearId } from '$components/YearRail.svelte'
  import { reveal } from '$lib/client/reveal'
  import { SvelteSet } from 'svelte/reactivity'

  interface Props {
    sections: GallerySection[]
    base?: string
  }

  const { sections, base = '/img/gallery' }: Props = $props()

  interface Piece extends GalleryItem {
    category: string
    categoryName: string
    sortYear: number
  }

  // Ranges like 2014/2015 sort by the year they were finished
  function sortYear(year?: string) {
    const years = year?.match(/\d{4}/g)

    return years ? Number(years.at(-1)) : 0
  }

  // Everything in one stream, newest first. The sort is stable, so pieces
  // from the same year keep the order they're listed in.
  const pieces: Piece[] = $derived(
    sections
      .flatMap(section => section.items.map(item => ({
        ...item,
        category: section.id,
        categoryName: section.name,
        sortYear: sortYear(item.year),
      })))
      .sort((a, b) => b.sortYear - a.sortYear),
  )

  // Categories toggle on and off independently, hidden ones start off. Only
  // the initial sections matter here, the toggles own the state after that.
  // svelte-ignore state_referenced_locally
  const enabled = new SvelteSet(sections.filter(section => !section.hidden).map(section => section.id))
  let top: HTMLElement | undefined = $state()
  let width = $state(0)

  const COLUMN = 240
  const GAP = 12
  const MOBILE = 760

  const all = $derived(sections.every(section => enabled.has(section.id)))
  const visible = $derived(pieces.filter(piece => enabled.has(piece.category)))

  const years = $derived.by(() => {
    const groups: Array<{ label: string, pieces: Piece[] }> = []

    for (const piece of visible) {
      const label = piece.sortYear ? String(piece.sortYear) : 'Undated'

      if (groups.at(-1)?.label !== label)
        groups.push({ label, pieces: [] })

      groups.at(-1)!.pieces.push(piece)
    }

    return groups
  })

  const label = (piece: Piece) => [piece.year, piece.name].filter(Boolean).join(' ')

  // Position of each piece in the stream, the lightbox follows this and not
  // the column by column DOM order
  const order = $derived(new Map(visible.map((piece, i) => [piece.slug, i])))

  // Masonry by hand: as many columns as fit, but never more than a year has
  // pieces, so short years stay centered. Each piece drops into the shortest
  // column, measured in height to width ratios.
  function layout(group: Piece[]) {
    const mobile = width > 0 && width < MOBILE
    const fit = mobile ? 2 : Math.max(1, Math.floor((width + GAP) / (COLUMN + GAP)))
    const count = Math.min(width ? fit : 5, group.length)
    const size = mobile ? (width - GAP) / 2 : COLUMN

    const columns = Array.from({ length: count }, () => ({ height: 0, pieces: [] as Piece[] }))

    for (const piece of group) {
      const shortest = columns.reduce((a, b) => (b.height < a.height ? b : a))

      shortest.pieces.push(piece)
      shortest.height += (piece.width && piece.height ? piece.height / piece.width : 9 / 16) + 0.05
    }

    return { columns, size }
  }

  // Alt-click solos the category instead of toggling it
  function toggle(category: string, event: MouseEvent) {
    if (event.altKey)
      enabled.clear()

    if (enabled.has(category))
      enabled.delete(category)
    else
      enabled.add(category)

    top?.scrollIntoView()
  }

  function showAll() {
    for (const section of sections)
      enabled.add(section.id)

    top?.scrollIntoView()
  }

</script>

<div class="content-navigation filters">
  <button class:active={all} onclick={showAll}>All <span>{pieces.length}</span></button>

  {#each sections as section (section.id)}
    <button class:active={enabled.has(section.id)} aria-pressed={enabled.has(section.id)} onclick={event => toggle(section.id, event)}>
      {section.name} <span>{section.items.length}</span>
    </button>
  {/each}
</div>

<div class="gallery" bind:this={top}>
  <div class="stream" bind:clientWidth={width}>
    {#each years as group (group.label)}
      {@const { columns, size } = layout(group.pieces)}

      <section class="year-group">
        <h2 id={yearId(group.label)} class="year-pill">{group.label}</h2>

        <div class="masonry" style:--column="{size}px">
          {#each columns as column, i (i)}
            <div class="column">
              {#each column.pieces as piece (piece.slug)}
                <!-- Plain links, Content.svelte opens them in the lightbox -->
                <a
                  class="tile"
                  class:video={piece.video}
                  href={piece.video ? `https://www.youtube.com/watch?v=${piece.video}` : `${base}/${piece.slug}.webp`}
                  data-lightbox="gallery"
                  data-order={order.get(piece.slug)}
                  data-video={piece.video}
                  data-title={label(piece)}
                  use:reveal
                >
                  <img src="{base}/thumbs/{piece.slug}.webp" alt={piece.name ?? ''} loading="lazy" width={piece.width} height={piece.height} />

                  <span class="caption">
                    {#if piece.name}{label(piece)}{/if}
                    <small>{piece.categoryName}</small>
                  </span>
                </a>
              {/each}
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>

<YearRail years={years.map(group => group.label)} />

<style lang="scss">
  @use "@/vars.scss" as vars;

  .filters button {
    all: unset;
    margin: 0 10px;
    padding-bottom: 1px;
    border-bottom: 1px solid transparent;
    cursor: pointer;
    transition:
      color 0.12s ease-in-out,
      border 0.12s ease-in-out;

    span {
      color: vars.$muted-color;
    }

    &:hover,
    &:focus-visible {
      color: vars.$highlight-color;
    }

    &.active {
      color: vars.$highlight-color;
      border-bottom-color: vars.$base-color;
    }
  }

  // Centered, with the same room on both sides so the year rail on the right
  // doesn't pull everything off center
  .gallery {
    // Keeps the sticky year labels and tile layers from competing with the
    // fixed bars
    isolation: isolate;
    box-sizing: border-box;
    max-width: 2000px;
    margin: 0 auto;
    padding: 0 88px 64px;
    scroll-margin-top: 90px;

    @media all and (max-width: vars.$content-width-mobile) {
      padding: 0 8px 48px;
    }
  }

  .year-group {
    margin-top: 16px;
  }

  .masonry {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 12px;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: var(--column);

    :global(.tile) {
      width: 100%;
      aspect-ratio: auto;
    }

    :global(.tile img) {
      height: auto;
    }
  }

  .caption small {
    display: block;
    color: vars.$muted-color;
    font-size: 0.85em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
</style>
