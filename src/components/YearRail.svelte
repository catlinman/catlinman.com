<script lang="ts" module>
  // Anchor for a year label, ranges like "2016 - 2018" included
  export function yearId(label: string) {
    return `year-${label.replace(/\W+/g, '-')}`
  }
</script>

<script lang="ts">
  interface Props {
    years: string[]
  }

  const { years }: Props = $props()

  let active = $state('')

  // The active year is the last label that has scrolled up past the bars.
  // Checked on every scroll, so a jump that skips over labels still lands on
  // the right one.
  $effect(() => {
    const headings = years.map(year => document.getElementById(yearId(year))).filter(Boolean) as HTMLElement[]

    if (!headings.length)
      return

    let raf = 0

    function update() {
      raf = 0

      const passed = headings.filter(heading => heading.getBoundingClientRect().top <= 160)

      active = years[headings.indexOf(passed.at(-1) ?? headings[0])]
    }

    function onScroll() {
      if (!raf)
        raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  })
</script>

<nav class="rail" aria-label="Years">
  {#each years as year (year)}
    <button class:active={active === year} onclick={() => document.getElementById(yearId(year))?.scrollIntoView()}>
      <!-- A range like 2016 - 2018 shows as its latest year -->
      {year.split(' - ').at(-1)}
    </button>
  {/each}
</nav>

<style lang="scss">
  @use "@/vars.scss" as vars;

  .rail {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 999px;
    border: 1px solid rgba(254, 206, 126, 0.1);
    background: rgba(13, 13, 13, 0.6);
    backdrop-filter: blur(16px);

    button {
      all: unset;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75em;
      letter-spacing: 1px;
      text-align: center;
      color: vars.$muted-color;
      cursor: pointer;
      transition:
        color 0.12s ease-in-out,
        background 0.12s ease-in-out;

      &:hover,
      &:focus-visible {
        color: vars.$highlight-color;
      }

      &.active {
        color: vars.$shadow-color;
        background: vars.$base-color;
      }
    }

    @media all and (max-width: vars.$content-width-mobile) {
      display: none;
    }
  }
</style>
