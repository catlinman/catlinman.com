<script lang="ts">
  import type { NavItem } from '$types/Content'
  import { goto } from '$app/navigation'
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
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto('/')
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
    width: 100%;
    height: 50px;
    color: vars.$highlight-color;
    border-bottom: 1px solid rgba(254, 206, 126, 0.1);
    background: rgba(13, 13, 13, 0.6);
    backdrop-filter: blur(16px);
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0px 0px 16px vars.$shadow-color;
    line-height: 44px;
    // Above anything that scrolls under it, sticky year labels included
    z-index: 5;

    a {
      margin: 0px 2px 0px;
      display: inline-block;
      font-size: 1.2em;
      width: 140px;
      cursor: pointer;
      border-left: 1px solid transparent;
      border-right: 1px solid transparent;
      border-top: 4px solid transparent;
      border-bottom: 1px solid transparent;
      transition:
        border 0.12s ease-in-out,
        color 0.12s ease-in-out,
        text-shadow 0.12s ease-in-out;

      &:hover,
      &.active {
        border-top: 4px solid vars.$base-color;
      }
    }

    // Phones spread the links evenly and scale them with the screen, so all
    // four fit on thin ones too
    @media all and (max-width: vars.$content-width-mobile) {
      display: flex;
      justify-content: space-evenly;
      box-sizing: border-box;
      padding: 0 4px;
      white-space: nowrap;

      a {
        width: auto;
        margin: 0;
        padding: 0 6px;
        font-size: clamp(0.8em, 4.2vw, 1.1em);
      }
    }
  }
</style>
