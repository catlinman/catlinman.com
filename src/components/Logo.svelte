<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    active: boolean
    element?: HTMLElement
  }

  let { active, element = $bindable() }: Props = $props()

  // Where the light settles with no pointer to follow: up and to the left,
  // where the art is palest anyway
  const REST = { x: -0.4, y: -0.5 }

  // Degrees of tilt with the pointer at the rim, and how much the art lifts
  // towards it while hovered
  const TILT = 4
  const LIFT = 0.01

  // How quickly the light chases the pointer, and how gently hovering eases
  // the tilt in and out. Higher is faster.
  const LIGHT_FOLLOW = 5
  const HOVER_FOLLOW = 2.5

  let art: HTMLElement
  let hitbox: HTMLElement

  // Light position across the logo circle, -1 to 1 on each axis, how much
  // the hover tilt is on, and the overall light level, which fades in on load
  const target = { x: REST.x, y: REST.y, hover: 0, light: 1 }
  const current = { x: REST.x, y: REST.y, hover: 0, light: 0 }

  let raf = 0
  let last = 0
  let angle = 0
  let reduceMotion: MediaQueryList | undefined

  function render() {
    const tilt = current.hover * TILT
    const rx = -current.y * tilt
    const ry = current.x * tilt

    art.style.transform = `perspective(1600px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${(1 + current.hover * LIFT).toFixed(4)})`
    art.style.setProperty('--light-x', current.x.toFixed(4))
    art.style.setProperty('--light-y', current.y.toFixed(4))
    art.style.setProperty('--light', current.light.toFixed(4))
    art.style.setProperty('--hover', current.hover.toFixed(4))

    // The rim light scales with distance from the centre, where the pointer's
    // direction swings around too fast to follow. Right at the centre the
    // direction is noise, so it holds the last one.
    const distance = Math.min(1, Math.hypot(current.x, current.y))

    if (distance > 0.02)
      angle = Math.atan2(current.y, current.x) * 180 / Math.PI

    art.style.setProperty('--angle', `${angle.toFixed(2)}deg`)
    art.style.setProperty('--distance', distance.toFixed(4))
  }

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    const light = 1 - Math.exp(-LIGHT_FOLLOW * dt)
    const hover = 1 - Math.exp(-HOVER_FOLLOW * dt)

    last = now

    current.x += (target.x - current.x) * light
    current.y += (target.y - current.y) * light
    current.hover += (target.hover - current.hover) * hover
    current.light += (target.light - current.light) * hover

    render()

    // Park the loop once it has caught up, the next pointer event restarts it
    const settled = Math.abs(target.x - current.x) < 0.001
      && Math.abs(target.y - current.y) < 0.001
      && Math.abs(target.hover - current.hover) < 0.001
      && Math.abs(target.light - current.light) < 0.001

    raf = settled ? 0 : requestAnimationFrame(tick)
  }

  function follow() {
    if (raf)
      return

    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function rest() {
    target.x = REST.x
    target.y = REST.y
    target.hover = 0
    follow()
  }

  // Touch would need a held finger to steer, which fights scrolling
  function tracks(e: PointerEvent) {
    return active && e.pointerType !== 'touch' && !reduceMotion?.matches
  }

  // The light follows the pointer anywhere on the page. Past the rim it
  // simply comes from that side.
  function onPointerMove(e: PointerEvent) {
    if (!tracks(e))
      return

    const rect = hitbox.getBoundingClientRect()
    const r = rect.width / 2

    let x = (e.clientX - rect.left - r) / r
    let y = (e.clientY - rect.top - r) / r
    const d = Math.hypot(x, y)

    if (d > 1) {
      x /= d
      y /= d
    }

    target.x = x
    target.y = y
    follow()
  }

  function onHover(e: PointerEvent) {
    if (!tracks(e))
      return

    target.hover = 1
    follow()
  }

  function onUnhover() {
    target.hover = 0
    follow()
  }

  // Settle back when the page moves on to content
  $effect(() => {
    if (!active)
      rest()
  })

  onMount(() => {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    window.addEventListener('pointermove', onPointerMove)
    document.documentElement.addEventListener('pointerleave', rest)

    follow()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', rest)
    }
  })
</script>

<div class="logo" bind:this={element}>
  <div class="art" bind:this={art}>
    <div class="layer glow"></div>
    <div class="layer rim"></div>
    <div class="layer shine"></div>
    <div class="bloom"></div>
  </div>

  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <a class="hitbox" href="/about/" aria-label="About" bind:this={hitbox} onpointerenter={onHover} onpointerleave={onUnhover}></a>
</div>

<style lang="scss">
  @use "@/vars.scss" as vars;

  $art: url('/img/logo.webp');

  // Desktop centres it on the page, sized and placed by the header so the
  // name lines up under it
  .logo {
    position: fixed;
    top: calc(var(--logo-center) - var(--logo-size) / 2);
    left: 0;
    right: 0;
    margin: 0 auto;
    width: var(--logo-size);
    height: var(--logo-size);
    container-type: size;

    // Phones centre it in the space under the name, which sits at the top.
    // It runs slightly past the sides, capped by that space's height so short
    // landscape screens still fit. Wider than the screen means it has to be
    // centred explicitly.
    @media all and (max-width: vars.$content-width-mobile) {
      --below-name: 130px;
      --logo-size: min(134vw,calc(100dvh - var(--below-name) - 24px));

      top: calc(var(--below-name) + (100dvh - var(--below-name) - var(--logo-size)) / 2);
      left: calc(50% - var(--logo-size) / 2);
      right: auto;
      margin: 0;
      width: var(--logo-size);
      height: var(--logo-size);
    }
  }

  // Isolated so the metal layers only blend with the art, never with the
  // particles behind it. The circle matches the particle obstacle: drawn at
  // the box's shorter side and centred a touch low.
  .art {
    --light-x: 0;
    --light-y: 0;
    --light: 0;
    --hover: 0;
    --angle: 0deg;
    --distance: 0;
    --size: min(100cqw, 100cqh);
    --r: calc(var(--size) * 0.42);
    --cx: 50%;
    --cy: calc(50% + var(--size) * 0.01);

    position: absolute;
    inset: 0;
    isolation: isolate;
    background: $art center / contain no-repeat;
  }

  .layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--light);
    -webkit-mask: $art center / contain no-repeat;
    mask: $art center / contain no-repeat;
  }

  // Every layer only adds pale gold light, so the art keeps its colours and
  // the far side reads darker just by getting less of it

  // Broad light falling across the dome from the pointer's side
  .glow {
    background: radial-gradient(
      circle calc(var(--r) * 1.1) at calc(var(--cx) + var(--light-x) * var(--r) * 0.5) calc(var(--cy) + var(--light-y) * var(--r) * 0.5),
      rgba(255, 238, 195, 0.3) 0%,
      rgba(255, 238, 195, 0.12) 45%,
      rgba(255, 238, 195, 0) 100%
    );
    mix-blend-mode: screen;
  }

  // Light catching the edge on the pointer's side
  .rim {
    background: radial-gradient(
      circle var(--r) at var(--cx) var(--cy),
      rgba(255, 244, 215, 0) 72%,
      rgba(255, 244, 215, 0.55) 92%,
      rgba(255, 244, 215, 0) 100%
    );
    mix-blend-mode: screen;
    opacity: calc(var(--light) * var(--distance));
    -webkit-mask:
      $art center / contain no-repeat,
      linear-gradient(calc(var(--angle) + 90deg), transparent 45%, black 100%);
    -webkit-mask-composite: source-in;
    mask:
      $art center / contain no-repeat,
      linear-gradient(calc(var(--angle) + 90deg), transparent 45%, black 100%);
    mask-composite: intersect;
  }

  // Specular hotspot partway towards the pointer, where a dome catches light
  .shine {
    background: radial-gradient(
      circle calc(var(--r) * 0.35) at calc(var(--cx) + var(--light-x) * var(--r) * 0.45) calc(var(--cy) + var(--light-y) * var(--r) * 0.45),
      rgba(255, 250, 235, 0.5) 0%,
      rgba(255, 250, 235, 0.15) 45%,
      rgba(255, 250, 235, 0) 100%
    );
    mix-blend-mode: screen;
  }

  // Bloom where the light hits: a blurred, brightened copy of the art that
  // bleeds past the rim on the lit side. Unlike the layers above it isn't
  // held to the art's shape. Faint at rest, it swells while hovered.
  .bloom {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: $art center / contain no-repeat;
    filter: blur(calc(var(--size) * 0.03)) brightness(1.8) saturate(1.2);
    mix-blend-mode: screen;
    opacity: calc(var(--light) * (0.25 + var(--hover) * 0.5));
    -webkit-mask: radial-gradient(
      circle calc(var(--r) * 0.9) at calc(var(--cx) + var(--light-x) * var(--r) * 0.6) calc(var(--cy) + var(--light-y) * var(--r) * 0.6),
      black 0%,
      rgba(0, 0, 0, 0.35) 50%,
      transparent 100%
    );
    mask: radial-gradient(
      circle calc(var(--r) * 0.9) at calc(var(--cx) + var(--light-x) * var(--r) * 0.6) calc(var(--cy) + var(--light-y) * var(--r) * 0.6),
      black 0%,
      rgba(0, 0, 0, 0.35) 50%,
      transparent 100%
    );
  }

  // The link covers only the art's circle, so the empty corners of the box
  // stay background
  .hitbox {
    --size: min(100cqw, 100cqh);

    position: absolute;
    left: 50%;
    top: calc(50% + var(--size) * 0.01);
    width: calc(var(--size) * 0.84);
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
</style>
