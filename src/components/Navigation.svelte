<script lang="ts">
  import type { NavItem } from '$types/Content'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'

  interface Props {
    items?: NavItem[]
  }

  const { items = [] }: Props = $props()

  // Nested pages like about/setup keep their parent highlighted
  const root = $derived(page.url.pathname.split('/')[1] ?? '')

  function onClick(e: MouseEvent, slug: string) {
    // Clicking the open page's link closes it and returns to the landing page
    if (slug !== root)
      return

    e.preventDefault()
    goto(resolve('/'))
  }
</script>

<nav>
  {#each items as item (item.slug)}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href="/{item.slug}/" class:active={item.slug === root} onclick={e => onClick(e, item.slug)}>
      {item.navigation || item.heading}
    </a>
  {/each}
</nav>

<style lang="scss">
  @use "@/vars.scss" as vars;

  nav {
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    min-width: vars.$content-width-mobile;
    width: 100%;
    height: 50px;
    color: vars.$highlight-color;
    border-bottom: 1px solid vars.$dim-color;
    background: linear-gradient(90deg, vars.$shadow-color, vars.$background-color, vars.$shadow-color);
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0px 0px 16px vars.$shadow-color;
    line-height: 44px;
    z-index: 1;

    a {
      margin: 0px 2px 0px;
      display: inline-block;
      font-size: 1.2em;
      width: 140px;
      cursor: pointer;
      border-left: 1px solid vars.$shadow-color;
      border-right: 1px solid vars.$shadow-color;
      border-top: 4px solid vars.$shadow-color;
      border-bottom: 1px solid vars.$shadow-color;
      transition:
        border 0.25s ease-in-out,
        color 0.25s ease-in-out,
        text-shadow 0.25s ease-in-out;

      &:hover,
      &.active {
        border-top: 4px solid vars.$base-color;
      }
    }
  }
</style>
