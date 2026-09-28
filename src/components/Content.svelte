<script lang="ts">
  import type { GallerySection, LightboxItem, Section } from '$types/Content'
  import Gallery from '$components/Gallery.svelte'
  import Lightbox from '$components/Lightbox.svelte'
  import YearRail, { yearId } from '$components/YearRail.svelte'
  import { observeReveal } from '$lib/client/reveal'
  import { onTableClick, prepareTables } from '$lib/client/tables'

  interface Props {
    html: string
    sections?: Section[]
    gallery?: GallerySection[]
  }

  const { html, sections = [], gallery = [] }: Props = $props()

  let container: HTMLDivElement | undefined = $state()
  let article: HTMLDivElement | undefined = $state()
  let lightbox: LightboxItem[] = $state([])
  let lightboxIndex = $state(0)

  // Every divider in the page splits it into its own floating panel
  const panels = $derived(html.split(/<hr\s*\/?>/).filter(panel => panel.trim()))

  // A panel that opens with <!-- year: 2014 --> or <!-- year: 2016 - 2018 -->
  // joins the timeline. Neighbours with the same year share one sticky label.
  const blocks = $derived.by(() => {
    const result: Array<{ year?: string, panels: string[] }> = []

    for (const panel of panels) {
      const year = panel.match(/^\s*<!-- year: (\d{4}(?: - \d{4})?) -->/)?.[1]
      const last = result.at(-1)

      if (last && year && last.year === year)
        last.panels.push(panel)
      else
        result.push({ year, panels: [panel] })
    }

    return result
  })

  const years = $derived(blocks.map(block => block.year).filter(Boolean) as string[])

  // Any link in the content marked with data-lightbox opens in the lightbox,
  // together with the other links that share its group name
  function onClick(e: MouseEvent) {
    const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0
    const embed = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-embed]')

    // Swap an embed's poster for the player in place
    if (embed && !modified) {
      e.preventDefault()

      const frame = document.createElement('iframe')
      frame.src = `https://www.youtube-nocookie.com/embed/${embed.dataset.embed}?autoplay=1&rel=0`
      frame.title = embed.querySelector('img')?.alt ?? ''
      frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture'
      frame.allowFullscreen = true

      const box = document.createElement('div')
      box.className = 'embed'
      box.append(frame)
      embed.replaceWith(box)

      return
    }

    // A click anywhere on a hero opens its media, same as its corner button
    const target = e.target as HTMLElement
    const heroOpen = target.closest('.hero')?.querySelector<HTMLAnchorElement>('a.hero-open')

    if (heroOpen && !modified && !target.closest('a, button')) {
      heroOpen.click()
      return
    }

    const link = target.closest<HTMLAnchorElement>('a[data-lightbox]')

    if (!link || !container) {
      onTableClick(e)
      return
    }

    // Modified clicks still open the file or video in a new tab
    if (modified)
      return

    e.preventDefault()

    // Tiles can carry their own order when the layout shuffles the DOM, the
    // sort is stable so plain links keep their document order
    const group = [...container.querySelectorAll<HTMLAnchorElement>(`a[data-lightbox="${CSS.escape(link.dataset.lightbox ?? '')}"]`)]
      .sort((a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0))

    lightbox = group.map(a => ({ src: a.href, video: a.dataset.video, title: a.dataset.title ?? '' }))
    lightboxIndex = group.indexOf(link)
  }

  $effect(() => {
    if (!article || !html)
      return

    prepareTables(article)
    article.querySelectorAll('.panel, .tile').forEach(observeReveal)
  })
</script>

{#if sections.length}
  <div class="content-navigation">
    {#each sections as section, i (section.id)}
      {#if i > 0}&middot;{/if}
      <a href="#{section.id}">{section.name}</a>
    {/each}
  </div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="content-body" bind:this={container} onclick={onClick}>
  <div class="content-contained" class:with-sections={sections.length} class:with-filters={gallery.length} bind:this={article}>
    <span id="top"></span>

    {#each blocks as block, i (i)}
      {#if block.year}
        <div class="timeline-year">
          <h2 id={yearId(block.year)} class="year-pill">{block.year}</h2>

          {#each block.panels as panel, j (j)}
            <section class="panel">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html panel}
            </section>
          {/each}
        </div>
      {:else}
        {#each block.panels as panel, j (j)}
          <section class="panel">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html panel}
          </section>
        {/each}
      {/if}
    {/each}
  </div>

  {#if years.length}
    <YearRail {years} />
  {/if}

  <!-- The gallery runs the full width of the screen, outside the text column -->
  {#if gallery.length}
    <Gallery sections={gallery} />
  {/if}
</div>

{#if lightbox.length}
  <Lightbox items={lightbox} bind:index={lightboxIndex} onClose={() => (lightbox = [])} />
{/if}

<style lang="scss">
  @use "@/vars.scss" as vars;

  // Clicks on the empty margins fall through to the background, which closes
  // the page
  .content-body {
    pointer-events: none;

    > :global(*) {
      pointer-events: auto;
    }
  }

  // Room for the section bar, which phones hide, and the gallery filters,
  // which they keep
  .with-sections,
  .with-filters {
    padding-top: 36px;
  }

  @media all and (max-width: vars.$content-width-mobile) {
    .with-sections {
      padding-top: 0;
    }
  }

  #top {
    position: absolute;
    top: 0;
  }

  .timeline-year {
    margin-top: 32px;

    // The year rail tracks the position here, and a stuck label would sit on
    // top of the headings as they scroll under it
    :global(.year-pill) {
      position: static;
    }
  }
</style>
