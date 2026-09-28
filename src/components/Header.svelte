<script lang="ts">
  import { psas } from '$lib/psa'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  interface Props {
    effects: boolean
    contentActive: boolean
    blurred: boolean
  }

  const { effects, contentActive, blurred }: Props = $props()

  const PSA_INTERVAL_MS = 15000
  const PARALLAX_SMOOTHING = 0.1

  let header: HTMLElement
  let psa = $state(psas[Math.floor(Math.random() * psas.length)])

  function nextPsa() {
    let next = psa

    while (next === psa)
      next = psas[Math.floor(Math.random() * psas.length)]

    psa = next
  }

  onMount(() => {
    const timer = window.setInterval(() => {
      if (!contentActive)
        nextPsa()
    }, PSA_INTERVAL_MS)

    // ── Parallax ──
    // The header tilts towards the cursor on the landing page and eases flat
    // again whenever content is open or effects are off.

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let tiltX = 0
    let tiltY = 0
    let raf = 0

    function onMouseMove(e: MouseEvent) {
      if (contentActive || !effects)
        return

      mouseX = e.clientX
      mouseY = e.clientY
    }

    function tilt() {
      raf = requestAnimationFrame(tilt)

      const width = window.innerWidth
      const height = window.innerHeight
      const follow = effects && !contentActive

      const targetX = follow ? (0.5 - mouseY / height) * 15 : 0
      const targetY = follow ? -(0.5 - mouseX / width) * 20 : 0

      tiltX += (targetX - tiltX) * PARALLAX_SMOOTHING
      tiltY += (targetY - tiltY) * PARALLAX_SMOOTHING

      if (!effects && Math.abs(tiltX) + Math.abs(tiltY) < 0.1) {
        header.style.transform = ''
        return
      }

      header.style.transform = `perspective(${(width + height) / 2}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
    }

    window.addEventListener('mousemove', onMouseMove)
    raf = requestAnimationFrame(tilt)

    return () => {
      clearInterval(timer)
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
    }
  })
</script>

<header class="noselect" class:blurred bind:this={header}>
  <div class="logo"></div>

  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <h1><a href="/about/">- Catlinman -</a></h1>

  {#if !contentActive}
    {#key psa}
      <h2 class="psa" title="PSA by {psa.author}" in:fade={{ delay: 400 }} out:fade>"{psa.content}"</h2>
    {/key}

    <p class="retired" transition:fade>
      This handle was retired in 2020. You can find me as <a href="https://zealsprince.com">zealsprince</a> now.
    </p>
  {/if}

  <span class="top"></span>
  <span class="bottom"></span>
</header>

<style lang="scss">
  @use "@/vars.scss" as vars;

  header {
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

  .logo {
    position: fixed;
    top: 0;
    bottom: 16%;
    left: 0;
    right: 0;
    margin: auto;
    width: 1024px;
    height: 1024px;
    min-width: 50%;
    min-height: 50%;
    max-width: 70%;
    max-height: 70%;
    border-radius: 100px;
    background: url('/img/logo.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    animation: logo-pulse 10s ease-in-out infinite;

    @media all and (max-width: vars.$content-width-mobile) {
      min-width: 90%;
      min-height: 70%;
    }
  }

  @keyframes logo-pulse {
    0%, 100% {
      transform: scale(1);
    }

    50% {
      transform: scale(0.9);
    }
  }

  h1 {
    width: 640px;
    position: fixed;
    bottom: 13%;
    left: 0;
    right: 0;
    margin: auto;
    font-weight: 100;
    font-size: 4em;
    letter-spacing: 10px;
    text-align: center;
    transition:
      letter-spacing 0.5s ease-in-out,
      color 0.5s ease-in-out,
      text-shadow 0.5s ease-in-out;

    &:hover {
      letter-spacing: 16px;
      color: vars.$highlight-color;
      text-shadow: 0px 0px 64px rgba(254, 206, 126, 0.75);
    }

    @media all and (max-width: vars.$content-width-mobile) {
      width: 100%;
      bottom: 18%;
    }
  }

  .psa {
    position: fixed;
    bottom: 7%;
    left: 0;
    right: 0;
    margin: 0;
    font-weight: 400;
    font-size: 1.2em;
    letter-spacing: 3px;

    @media all and (max-width: vars.$content-width-mobile) {
      bottom: 13%;
      font-size: 1em;
    }
  }

  // Not part of the 2017 design. It's here so anyone arriving from the old
  // handle knows where to go.
  .retired {
    position: fixed;
    bottom: 64px;
    left: 0;
    right: 0;
    margin: 0;
    color: vars.$muted-color;
    -webkit-text-stroke: 0;
    font-family: vars.$primary-font;
    font-size: 0.75em;
    letter-spacing: 2px;
    white-space: normal;

    a {
      -webkit-text-stroke: 0;
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

  .bottom {
    position: fixed;
    background: linear-gradient(0deg, vars.$shadow-color, vars.$shadow-color, vars.$background-color);
    width: 200%;
    height: 154px;
    left: -50%;
    bottom: -128px;
  }
</style>
