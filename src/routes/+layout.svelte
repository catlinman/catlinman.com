<script lang="ts">
  import type { NavItem } from '$types/Content'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Footer from '$components/Footer.svelte'
  import Header from '$components/Header.svelte'
  import Navigation from '$components/Navigation.svelte'
  import Progress from '$components/Progress.svelte'
  import Particles from '$scenes/Particles.svelte'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import '@fontsource/roboto/300.css'
  import '@fontsource/work-sans/100.css'
  import '../app.scss'

  const { data, children }: { data: { navItems: NavItem[] }, children: any } = $props()

  // Particles only run for visitors who haven't asked for reduced motion
  let effects = $state(true)
  let logo = $state<HTMLElement>()

  // Every path except the landing page opens content over the background
  const contentActive = $derived(page.url.pathname !== '/')
  const blurred = $derived(contentActive && effects)

  onMount(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => effects = !reduceMotion.matches

    update()
    reduceMotion.addEventListener('change', update)

    return () => reduceMotion.removeEventListener('change', update)
  })

  // Clicking the background or pressing escape backs out to the landing page
  function close() {
    if (contentActive)
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto('/')
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
  <Particles enabled={effects} {blurred} obstacle={logo} />
  <Header {contentActive} {blurred} bind:logo />
</div>

<Progress />
<Navigation items={data.navItems} />

<div class="stage">
  {#key page.url.pathname}
    <!-- No fade in: an ancestor with opacity switches off the glass blur on the
    panels, which animate in by themselves -->
    <div class="content" out:fade={{ duration: 200 }}>
      {@render children()}
    </div>
  {/key}
</div>

<Footer />

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

  // At least a screen tall, so the footer always waits below the fold and the
  // landing page composition stays untouched until someone scrolls.
  // The column may shrink below its content's widest line, otherwise a wide
  // table stretches the whole page past the screen on phones
  .stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-height: 100vh;
    pointer-events: none;
  }

  // Outgoing and incoming pages share one grid cell while they cross-fade.
  // The wrapper lets clicks through so the margins still reach the background.
  .content {
    grid-area: 1 / 1;
    pointer-events: none;

    > :global(*) {
      pointer-events: auto;
    }
  }
</style>
