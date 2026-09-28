<script lang="ts">
  import type { NavItem } from '$types/Content'
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'

  interface Props {
    items?: NavItem[]
  }

  const { items = [] }: Props = $props()

  // Phones fold the links into a menu under the bar
  let open = $state(false)

  // Nested pages like about/setup keep their parent highlighted
  const root = $derived(page.url.pathname.split('/')[1] ?? '')

  const links = $derived([
    { href: '/', label: 'Home', active: root === '' },
    ...items.map(item => ({
      href: `/${item.slug}/`,
      label: item.navigation || item.heading,
      active: item.slug === root,
    })),
  ])

  const current = $derived(links.find(link => link.active)?.label ?? '')

  afterNavigate(() => {
    open = false
  })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape')
      open = false
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<nav class:open>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" onclick={() => (open = false)}></div>

  <div class="bar">
    <span class="current">{current}</span>

    <button class="toggle" aria-label="Menu" aria-expanded={open} aria-controls="nav-links" onclick={() => (open = !open)}>
      <svg viewBox="0 0 100 100" width="24" height="24">
        <line x1="20" y1="30" x2="80" y2="30" />
        <line x1="20" y1="50" x2="80" y2="50" />
        <line x1="20" y1="70" x2="80" y2="70" />
      </svg>
    </button>
  </div>

  <div class="links" id="nav-links">
    {#each links as link (link.href)}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a href={link.href} class:active={link.active} aria-current={link.active ? 'page' : undefined}>
        {link.label}
      </a>
    {/each}
  </div>
</nav>

<style lang="scss">
  @use "@/vars.scss" as vars;

  nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    color: vars.$highlight-color;
    text-align: center;
    text-transform: uppercase;
    text-shadow: 0px 0px 16px vars.$shadow-color;
    line-height: 44px;
    // Above anything that scrolls under it, sticky year labels included
    z-index: 5;

    // The glass sits on a layer of its own. A backdrop filter on the nav itself
    // would stop the phone menu's glass from blurring the page behind it.
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      border-bottom: 1px solid rgba(254, 206, 126, 0.1);
      background: rgba(13, 13, 13, 0.6);
      backdrop-filter: blur(16px);
    }
  }

  .links a {
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

  .bar,
  .scrim {
    display: none;
  }

  // Phones show the open page's name and a toggle, the links drop down as a
  // panel under the bar
  @media all and (max-width: vars.$content-width-mobile) {
    .bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding-left: 20px;
    }

    .current {
      font-size: 1.1em;
      letter-spacing: 2px;
    }

    .toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      padding: 0;
      border: none;
      background: none;
      color: vars.$base-color;
      cursor: pointer;
    }

    // Each line turns about the middle of the icon, not its own centre, so the
    // two strokes of the X meet exactly
    line {
      stroke: currentColor;
      stroke-width: 6;
      stroke-linecap: round;
      transform-box: view-box;
      transform-origin: 50px 50px;
      transition:
        transform 0.3s ease-in-out,
        opacity 0.3s ease-in-out;
    }

    .open line:nth-child(1) {
      transform: rotate(45deg) translateY(20px);
    }

    .open line:nth-child(2) {
      opacity: 0;
    }

    .open line:nth-child(3) {
      transform: rotate(-45deg) translateY(-20px);
    }

    // Covers the page while the menu is open, a tap anywhere else closes it
    .scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: -2;
      background: rgba(13, 13, 13, 0.5);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.2s ease-out,
        visibility 0.2s;
    }

    .links {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      padding: 8px 0;
      border-bottom: 1px solid rgba(254, 206, 126, 0.1);
      background: rgba(13, 13, 13, 0.75);
      backdrop-filter: blur(16px);
      opacity: 0;
      visibility: hidden;
      translate: 0 -8px;
      transition:
        opacity 0.2s ease-out,
        translate 0.2s ease-out,
        visibility 0.2s;

      a {
        display: block;
        width: auto;
        margin: 0;
        border: none;
        line-height: 52px;
        font-size: 1.1em;
        letter-spacing: 2px;

        // The desktop marker runs along the top, here it runs down the side
        &:hover,
        &.active {
          border: none;
          box-shadow: inset 4px 0 0 vars.$base-color;
        }
      }
    }

    .open .scrim,
    .open .links {
      opacity: 1;
      visibility: visible;
      translate: 0 0;
    }
  }
</style>
