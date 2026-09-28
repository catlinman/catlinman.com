<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    enabled: boolean
    blurred: boolean
  }

  const { enabled, blurred }: Props = $props()

  // Tuning carried over from the original p5 sketch
  const PARTICLE_MULT = 0.75
  const PARTICLE_SIZE = 6
  const PARTICLE_DIST = 64
  const FADE_MS = 400

  // The sketch was tuned per frame at 60 fps, so the simulation steps at that
  // rate no matter what the display refreshes at.
  const STEP_MS = 1000 / 60

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    fx: number // Future position the particle eases towards
    fy: number
  }

  let canvas: HTMLCanvasElement
  let running = $state(false)
  let fadeTimer = 0

  // Filled in on mount, the loop and its state live in that closure
  let scene: { start: () => void, stop: () => void } | null = null

  onMount(() => {
    const ctx = canvas.getContext('2d')!

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0

    // Hold H and drag to shift the palette
    let hueRange = 15
    let hueShift = 0
    let hueKey = false

    const mouse = { x: 0, y: 0, down: false, right: false }

    const map = (v: number, a: number, b: number, c: number, d: number) => c + (d - c) * ((v - a) / (b - a))

    function spawn(): Particle {
      const x = Math.random() * width
      const y = Math.random() * height

      // Particles near the center get flung outwards on the first frames
      const mean = (width + height) / 2
      const near = Math.hypot(x - width / 2, y - height / 2) < mean / 4
      const pushX = near ? x - width / 2 : 0
      const pushY = near ? y - height / 2 : 0

      return { x, y, vx: 0, vy: -2, fx: x + pushX, fy: y + pushY + 2 }
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1

      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.ceil((width * height) / 10000 * PARTICLE_MULT)

      particles = particles.slice(0, count)
      while (particles.length < count)
        particles.push(spawn())
    }

    function step() {
      if (hueKey && mouse.down) {
        hueRange = map(mouse.x, 0, width, 0, 100)
        hueShift = map(mouse.y, 0, height, 0, 100)
      }

      for (const p of particles) {
        // The original meant to sample noise here, but a stray comma operator
        // threw the noise away. This is the motion the site actually had.
        const n = (p.y + frame) * Math.PI * 2 * 8

        p.vx = (p.vx + Math.cos(n) / 2) * 0.9
        p.vy = (p.vy - Math.random() + 0.4) * 0.9

        p.fx += p.vx
        p.fy += p.vy

        p.x += (p.fx - p.x) * 0.1
        p.y += (p.fy - p.y) * 0.1

        // Wrap sideways, respawn at the bottom once off the top
        if (p.x < -PARTICLE_SIZE * 2) {
          p.x = width + PARTICLE_SIZE * 2 - 1
          p.fx = p.x
        }
        else if (p.x > width + PARTICLE_SIZE * 2) {
          p.x = -PARTICLE_SIZE * 2 + 1
          p.fx = p.x
        }

        if (p.y < 0) {
          p.x = Math.random() * width
          p.y = height + PARTICLE_SIZE * 2
          p.fx = p.x
          p.fy = p.y
        }

        if (!mouse.down)
          continue

        // Left click pushes particles away, right click pulls them in
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)

        if (dist === 0 || dist >= PARTICLE_DIST)
          continue

        const magnitude = mouse.right ? -dist / (PARTICLE_DIST / 6) : dist / (PARTICLE_DIST / 8)

        p.fx += (dx / dist) * magnitude
        p.fy += (dy / dist) * magnitude
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p, i) => {
        const hue = ((map(p.y, 0, height, hueRange + hueShift, -3 + hueShift) % 100) + 100) % 100
        const diameter = map(p.y, 0, height, PARTICLE_SIZE / 4, PARTICLE_SIZE + Math.sin((frame + i * 5) / 15) * PARTICLE_SIZE)

        ctx.fillStyle = `hsl(${hue * 3.6}, 100%, 50%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0, diameter / 2), 0, Math.PI * 2)
        ctx.fill()
      })
    }

    let raf = 0
    let last = performance.now()
    let accumulator = 0

    function loop(now: number) {
      raf = requestAnimationFrame(loop)

      accumulator += now - last
      last = now

      // Coming back to a background tab shouldn't fast-forward the scene
      if (accumulator > STEP_MS * 4)
        accumulator = STEP_MS

      while (accumulator >= STEP_MS) {
        step()
        frame++
        accumulator -= STEP_MS
      }

      draw()
    }

    // ── Input ──

    function onPointerMove(e: PointerEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    function onPointerDown(e: PointerEvent) {
      onPointerMove(e)
      mouse.down = true
      mouse.right = e.button === 2
    }

    function onPointerUp() {
      mouse.down = false
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'h' || e.key === 'H')
        hueKey = e.type === 'keydown'
    }

    resize()

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)

    scene = {
      start() {
        if (raf)
          return

        last = performance.now()
        raf = requestAnimationFrame(loop)
      },

      stop() {
        cancelAnimationFrame(raf)
        raf = 0
        ctx.clearRect(0, 0, width, height)
      },
    }

    return () => {
      scene = null
      clearTimeout(fadeTimer)
      cancelAnimationFrame(raf)

      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  })

  // Only burn frames while the scene is on, and let it fade out first
  $effect(() => {
    const on = enabled

    clearTimeout(fadeTimer)

    if (on) {
      scene?.start()
      running = true
      return
    }

    running = false
    fadeTimer = window.setTimeout(() => scene?.stop(), FADE_MS)
  })
</script>

<div id="particles" class:visible={running} class:blurred>
  <canvas bind:this={canvas}></canvas>
</div>

<style lang="scss">
  #particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -3;
    opacity: 0;
    transition: opacity 0.4s ease-in-out;
    animation: particles-in 2s;

    &.visible {
      opacity: 1;
    }

    &.blurred {
      filter: blur(4px);
    }
  }

  // Wait a second on first load, then fade in over the next
  @keyframes particles-in {
    0%, 50% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
