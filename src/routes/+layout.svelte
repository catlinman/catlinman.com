<script lang="ts">
  import type { NavItem } from '$types/Content'
  import { afterNavigate, goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import Controls from '$components/Controls.svelte'
  import Footer from '$components/Footer.svelte'
  import Header from '$components/Header.svelte'
  import Navigation from '$components/Navigation.svelte'
  import Progress from '$components/Progress.svelte'
  import Particles from '$scenes/Particles.svelte'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import '../app.scss'

  const { data, children }: { data: { navItems: NavItem[] }, children: any } = $props()

  const EFFECTS_KEY = 'fx-enabled'

  let effects = $state(true)
  let footerOpen = $state(false)

  // Every path except the landing page opens content over the background
  const contentActive = $derived(page.url.pathname !== '/')
  const blurred = $derived(contentActive && effects)

  onMount(() => {
    const stored = localStorage.getItem(EFFECTS_KEY)

    effects = stored === null
      ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : stored === 'true'
  })

  afterNavigate(() => {
    footerOpen = false
  })

  function toggleEffects() {
    effects = !effects
    localStorage.setItem(EFFECTS_KEY, String(effects))
  }

  // Clicking the background or pressing escape backs out to the landing page
  function close() {
    footerOpen = false

    if (contentActive)
      goto(resolve('/'))
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape')
      close()
  }
</script>

<svelte:window onkeyup={onKeyUp} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="background" onclick={close} oncontextmenu={e => e.preventDefault()}>
  <div class="vignette"></div>
  <Particles enabled={effects} {blurred} />
  <Header {effects} {contentActive} {blurred} />
</div>

<Progress />
<Navigation items={data.navItems} />
<Controls {effects} onToggle={toggleEffects} />

{#key page.url.pathname}
  <div class="content" in:fade={{ duration: 400, delay: 200 }} out:fade={{ duration: 200 }}>
    {@render children()}
  </div>
{/key}

<Footer bind:open={footerOpen} />

<style lang="scss">
  @use "@/vars.scss" as vars;

  .background {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .vignette {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -4;
    background: radial-gradient(transparent, vars.$shadow-color);
    pointer-events: none;
  }

  // Outgoing and incoming pages overlap while they cross-fade. The wrapper
  // lets clicks through so the margins still reach the background.
  .content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    pointer-events: none;

    > :global(*) {
      pointer-events: auto;
    }
  }
</style>
