<script lang="ts">
  import Logo from '$components/Logo.svelte'
  import { psas } from '$lib/psa'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  interface Props {
    contentActive: boolean
    blurred: boolean
    logo?: HTMLElement
  }

  let { contentActive, blurred, logo = $bindable() }: Props = $props()

  const PSA_INTERVAL_MS = 15000
  const UNLOCK_HOVER_MS = 5000

  // The quotes stay hidden until someone rests on the subtitle for a while
  let quotes = $state(false)
  let psa = $state(psas[Math.floor(Math.random() * psas.length)])
  let hoverTimer = 0

  function nextPsa() {
    let next = psa

    while (next === psa)
      next = psas[Math.floor(Math.random() * psas.length)]

    psa = next
  }

  function startHover() {
    hoverTimer = window.setTimeout(() => {
      nextPsa()
      quotes = true
    }, UNLOCK_HOVER_MS)
  }

  onMount(() => {
    const timer = window.setInterval(() => {
      if (quotes && !contentActive)
        nextPsa()
    }, PSA_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      clearTimeout(hoverTimer)
    }
  })
</script>

<!-- Blurred behind a page, so its links step out of the way -->
<header class="noselect" class:blurred inert={contentActive}>
  <Logo active={!contentActive} bind:element={logo} />

  {#if !contentActive}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <h1 in:fade|global={{ delay: 400 }} out:fade|global><a href="/about/">- Catlinman -</a></h1>

    {#if quotes}
      {#key psa}
        <h2 class="subtitle" title="PSA by {psa.author}" in:fade|global={{ delay: 400 }} out:fade|global>"{psa.content}"</h2>
      {/key}
    {:else}
      <h2
        class="subtitle charging"
        in:fade|global={{ delay: 400 }}
        out:fade|global
        onmouseenter={startHover}
        onmouseleave={() => clearTimeout(hoverTimer)}
      >
        Once a radical dreamer, now <a class="zeal" href="https://zealsprince.com" title="zealsprince.com">a prince of zeal</a>
      </h2>
    {/if}
  {/if}

  <span class="top"></span>
</header>

<style lang="scss">
  @use "@/vars.scss" as vars;

  header {
    // Shared with the logo so the name can hang right under the art. The art
    // circle reaches 0.43 of the box below its centre, and the centre rises
    // off the middle only when a short screen can't fit the name beneath it.
    --logo-size: min(clamp(50vw, 1024px, 70vw), clamp(50vh, 1024px, 70vh));
    --logo-reach: calc(var(--logo-size) * 0.43);
    --logo-center: min(50vh, 100vh - var(--logo-reach) - 212px);
    --name-top: calc(var(--logo-center) + var(--logo-reach) + 48px);

    z-index: -2;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: vars.$base-color;
    font-family: vars.$logo-font;
    -webkit-font-smoothing: subpixel-antialiased;
    -webkit-text-stroke: 1px vars.$base-color;
    text-shadow: 0px 0px 32px vars.$shadow-color;
    text-transform: uppercase;
    white-space: nowrap;

    &.blurred {
      filter: blur(4px);
    }
  }

  // Under the logo on desktop. Phones move the name to the top, under the nav.
  // Sized to the text, since centred text that outgrows a fixed box only
  // spills out to the right.
  h1 {
    position: fixed;
    top: var(--name-top);
    left: 0;
    right: 0;
    width: fit-content;
    margin: auto;
    font-weight: 100;
    font-size: 4em;
    letter-spacing: 14px;
    text-align: center;

    // Letter spacing trails the last glyph too, so a matching indent keeps
    // the name centred as it widens
    text-indent: 14px;
    transition:
      letter-spacing 0.25s ease-in-out,
      text-indent 0.25s ease-in-out,
      color 0.25s ease-in-out,
      text-shadow 0.25s ease-in-out;

    &:hover {
      letter-spacing: 20px;
      text-indent: 20px;
      color: vars.$highlight-color;
      text-shadow: 0px 0px 64px rgba(254, 206, 126, 0.75);
    }

    @media all and (max-width: vars.$content-width-mobile) {
      top: 72px;
      width: 100%;
      font-size: clamp(1.8em, 9vw, 2.4em);
      letter-spacing: 6px;
      text-indent: 6px;
      line-height: 1.2;

      &:hover {
        letter-spacing: 8px;
        text-indent: 8px;
      }
    }
  }

  .subtitle {
    position: fixed;
    top: calc(var(--name-top) + 96px);
    left: 0;
    right: 0;
    margin: 0;
    font-weight: 400;
    font-size: 1.2em;
    letter-spacing: 3px;

    // Phones leave the subtitle out and give the logo the room
    @media all and (max-width: vars.$content-width-mobile) {
      display: none;
    }
  }

  // Resting on the subtitle slowly brightens it until the quotes take over,
  // and leaving early lets it fade straight back
  .charging {
    transition:
      color 0.2s ease-out,
      text-shadow 0.2s ease-out;

    &:hover {
      color: vars.$highlight-color;
      text-shadow: 0px 0px 48px rgba(254, 206, 126, 0.75);
      transition:
        color 5s linear,
        text-shadow 5s linear;
    }
  }

  .zeal {
    transition:
      color 0.12s ease-in-out,
      text-shadow 0.12s ease-in-out,
      -webkit-text-stroke-color 0.12s ease-in-out;

    &:hover,
    &:focus-visible {
      color: vars.$highlight-color;
      -webkit-text-stroke-color: vars.$highlight-color;
      text-shadow: 0px 0px 24px vars.$base-color;
    }
  }

  .top {
    position: fixed;
    background: linear-gradient(180deg, vars.$shadow-color, vars.$shadow-color, vars.$background-color);
    width: 200%;
    height: 148px;
    left: -50%;
    top: -96px;
  }
</style>
