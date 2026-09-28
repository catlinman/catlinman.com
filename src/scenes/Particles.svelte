<script lang="ts">
  import { createNoise3D } from '$lib/client/noise'
  import { onMount } from 'svelte'

  interface Props {
    enabled: boolean
    blurred: boolean
    obstacle?: HTMLElement // The logo, which the particles flow around
  }

  const { enabled, blurred, obstacle }: Props = $props()

  // Tuning carried over from the original p5 sketch
  const PARTICLE_MULT = 0.75
  const PARTICLE_SIZE = 6
  const PARTICLE_DIST = 64
  const FADE_MS = 400

  // The sketch was tuned per frame at 60 fps, so the simulation steps at that
  // rate no matter what the display refreshes at. Speeds below are px per step.
  const STEP_MS = 1000 / 60

  // Lifetime in steps, with the share of it spent fading in and where the
  // fade out starts
  const LIFE_MIN = 300
  const LIFE_MAX = 660
  const LIFE_FADE_IN = 0.12
  const LIFE_FADE_OUT = 0.35

  // Buoyancy that cools off over a particle's life, and how hard the
  // turbulence carries it compared to that
  const RISE = 0.9
  const FLOW = 1.1

  // A broad slow swirl with finer, faster eddies on top. Scale is noise units
  // per px, speed is how fast that layer evolves per step.
  const OCTAVES = [
    { scale: 1 / 420, speed: 0.0018, weight: 1, offset: 0 },
    { scale: 1 / 140, speed: 0.0045, weight: 0.45, offset: 73.1 },
  ]

  // Measured RMS of the raw curl, so FLOW comes out in px per step
  const CURL_RMS = 2.5
  const CURL_EPS = 0.01

  // Cursor forces, as acceleration at the cursor fading to nothing at the edge.
  // Hovering nudges particles aside, clicking pushes or pulls hard, and a
  // moving cursor drags some of its speed into them.
  const HOVER = 0.25
  const PUSH = 1.6
  const PULL = 0.8
  const WAKE = 0.06

  // The logo art is a circle centred a touch low in its square. The radius is
  // padded a little so the air parts just outside the visible edge. The ramp
  // is how far out, as a share of the radius, turbulence starts bending
  // around it, and the push shoves out anything inertia carried inside.
  const LOGO_CENTER_Y = 0.51
  const LOGO_RADIUS = 0.42
  const LOGO_RAMP = 0.5
  const LOGO_PUSH = 0.3

  // Depth runs from 0 at the back to 1 up front. Nearer particles are bigger,
  // brighter and cross the screen faster. Each depth also rides its own slice
  // of the noise, so the layers drift past each other. The bias crowds most
  // particles towards the back so the few up front stand out.
  const DEPTH_SIZE = [0.375, 2.1]
  const DEPTH_PACE = [0.35, 1.5]
  const DEPTH_ALPHA = [0.3, 1]
  const DEPTH_SLICE = 0.8
  const DEPTH_BIAS = 1.6

  // Each particle is a glow sprite whose solid core covers this share of its
  // radius, so the core matches the size the flat dots used to be
  const GLOW_CORE = 1 / 3
  const SPRITE_SIZE = 64
  const SPRITE_HUES = 72

  // Particles moving faster than STREAK_FROM px per step stretch along their
  // path by STREAK per px per step, up to STREAK_MAX times their length
  const STREAK_FROM = 1.5
  const STREAK = 0.2
  const STREAK_MAX = 1.5

  // How far below the bottom edge particles may spawn, so the bottom never
  // looks like a hard line they're born on
  const SPAWN_BELOW = 48

  interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    age: number
    life: number
    drag: number // How quickly it gives in to the flow, lower drifts wider
    depth: number
  }

  let canvas: HTMLCanvasElement
  let running = $state(false)
  let fadeTimer = 0

  // Filled in on mount, the loop and its state live in that closure
  let scene: { start: () => void, stop: () => void, measure: () => void } | null = null

  onMount(() => {
    const ctx = canvas.getContext('2d')!
    const noise = createNoise3D()

    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let frame = 0

    // Hold H and drag to shift the palette
    let hueRange = 15
    let hueShift = 0
    let hueKey = false

    const mouse = { x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, over: false, down: false, right: false }

    // Logo circle in px, zero radius until it's measured
    const logo = { x: 0, y: 0, r: 0 }

    const inLogo = (x: number, y: number) => Math.hypot(x - logo.x, y - logo.y) < logo.r

    const map = (v: number, a: number, b: number, c: number, d: number) => c + (d - c) * ((v - a) / (b - a))
    const random = (min: number, max: number) => min + Math.random() * (max - min)
    const lerp = ([a, b]: number[], t: number) => a + (b - a) * t

    function smoothstep(a: number, b: number, v: number) {
      const t = Math.min(1, Math.max(0, (v - a) / (b - a)))

      return t * t * (3 - 2 * t)
    }

    // The air a particle rides: curl noise turbulence plus its own rise, both
    // bent around the logo. Every part is divergence free, so particles swirl
    // past each other and part around the logo instead of piling up.
    const flow = { x: 0, y: 0 }

    function sampleFlow(x: number, y: number, rise: number, depth: number) {
      const dx = x - logo.x
      const dy = y - logo.y
      const r = Math.hypot(dx, dy)

      // Inside the logo there's no air to speak of, only a way out
      if (r < logo.r) {
        flow.x = r > 0 ? (dx / r) * rise : 0
        flow.y = r > 0 ? (dy / r) * rise : -rise
        return
      }

      let curlX = 0
      let curlY = 0
      let psi = 0

      for (const o of OCTAVES) {
        const nx = x * o.scale
        const ny = y * o.scale
        const nz = frame * o.speed + o.offset + depth * DEPTH_SLICE

        const east = noise(nx + CURL_EPS, ny, nz)
        const west = noise(nx - CURL_EPS, ny, nz)
        const south = noise(nx, ny + CURL_EPS, nz)
        const north = noise(nx, ny - CURL_EPS, nz)
        const k = o.weight / CURL_RMS

        curlX += ((south - north) / (2 * CURL_EPS)) * k
        curlY -= ((east - west) / (2 * CURL_EPS)) * k
        psi += ((east + west + south + north) / 4) * (k / o.scale)
      }

      if (logo.r <= 0) {
        flow.x = curlX * FLOW
        flow.y = curlY * FLOW - rise
        return
      }

      // Scaling the potential by a ramp that's zero at the logo's edge makes
      // the turbulence run along it there (Bridson's curl noise boundaries)
      const reach = logo.r * LOGO_RAMP
      const t = Math.min(1, (r - logo.r) / reach)
      const ramp = (15 * t - 10 * t ** 3 + 3 * t ** 5) / 8
      const slope = (15 * (1 - t * t) ** 2) / (8 * reach)

      flow.x = (ramp * curlX + psi * slope * (dy / r)) * FLOW
      flow.y = (ramp * curlY - psi * slope * (dx / r)) * FLOW

      // Rise as potential flow past a cylinder: it stalls under the logo,
      // speeds up past the sides and closes back up above
      const k = (logo.r * logo.r) / (r * r * r * r)

      flow.x += 2 * dx * dy * k * rise
      flow.y -= rise * (1 + (dx * dx - dy * dy) * k)
    }

    // Fresh particle somewhere on screen, partway through its life
    function spawn(): Particle {
      const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, drag: 0, depth: 0 }

      respawn(p)
      p.age = Math.random() * p.life

      // Particles near the center get flung outwards on the first frames
      const mean = (width + height) / 2
      const near = Math.hypot(p.x - width / 2, p.y - height / 2) < mean / 4

      if (near) {
        p.vx = (p.x - width / 2) * p.drag
        p.vy = (p.y - height / 2) * p.drag
      }

      return p
    }

    function respawn(p: Particle) {
      // Never born behind the logo. The cap only guards a degenerate layout.
      for (let tries = 0; tries < 8; tries++) {
        p.x = Math.random() * width
        p.y = Math.random() * (height + SPAWN_BELOW)

        if (!inLogo(p.x, p.y))
          break
      }

      p.age = 0
      p.life = random(LIFE_MIN, LIFE_MAX)
      p.drag = random(0.025, 0.07)
      p.depth = Math.random() ** DEPTH_BIAS

      // Start already moving with the air around it
      const pace = lerp(DEPTH_PACE, p.depth)

      sampleFlow(p.x, p.y, RISE, p.depth)
      p.vx = flow.x * pace
      p.vy = flow.y * pace
    }

    function measure() {
      if (!obstacle) {
        logo.r = 0
        return
      }

      // The art is drawn with background-size: contain, centred in the box
      const rect = obstacle.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)

      logo.x = rect.left + rect.width / 2
      logo.y = rect.top + rect.height / 2 + (LOGO_CENTER_Y - 0.5) * size
      logo.r = size * LOGO_RADIUS

      // Anything caught inside a freshly measured logo moves out, keeping its age
      for (const p of particles) {
        if (!inLogo(p.x, p.y))
          continue

        const age = p.age

        respawn(p)
        p.age = age
      }
    }

    function resize() {
      dpr = window.devicePixelRatio || 1

      width = window.innerWidth
      height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.ceil((width * height) / 10000 * PARTICLE_MULT)

      particles = particles.slice(0, count)
      while (particles.length < count)
        particles.push(spawn())

      measure()
    }

    function step() {
      if (hueKey && mouse.down) {
        hueRange = map(mouse.x, 0, width, 0, 100)
        hueShift = map(mouse.y, 0, height, 0, 100)
      }

      // Cursor speed per step, smoothed since pointer events don't land on steps
      mouse.vx += (mouse.x - mouse.lastX - mouse.vx) * 0.5
      mouse.vy += (mouse.y - mouse.lastY - mouse.vy) * 0.5
      mouse.lastX = mouse.x
      mouse.lastY = mouse.y

      for (const p of particles) {
        p.age++

        if (p.age >= p.life || p.y < -PARTICLE_SIZE * 2) {
          respawn(p)
          continue
        }

        // Ease the velocity towards the local air. Light particles lag and
        // overshoot the eddies, which spreads them out along the streams.
        const pace = lerp(DEPTH_PACE, p.depth)

        sampleFlow(p.x, p.y, RISE * (1 - 0.5 * p.age / p.life), p.depth)

        p.vx += (flow.x * pace - p.vx) * p.drag
        p.vy += (flow.y * pace - p.vy) * p.drag

        p.x += p.vx
        p.y += p.vy

        // Wrap sideways
        if (p.x < -PARTICLE_SIZE * 2)
          p.x = width + PARTICLE_SIZE * 2 - 1
        else if (p.x > width + PARTICLE_SIZE * 2)
          p.x = -PARTICLE_SIZE * 2 + 1

        // Inertia can still carry a particle over the logo's edge
        const lx = p.x - logo.x
        const ly = p.y - logo.y
        const lr = Math.hypot(lx, ly)

        if (lr > 0 && lr < logo.r) {
          p.vx += (lx / lr) * LOGO_PUSH
          p.vy += (ly / lr) * LOGO_PUSH
        }

        if (!mouse.over && !mouse.down)
          continue

        // Left click pushes particles away, right click pulls them in
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.hypot(dx, dy)

        if (dist === 0 || dist >= PARTICLE_DIST)
          continue

        const falloff = 1 - dist / PARTICLE_DIST
        const force = mouse.down ? (mouse.right ? -PULL : PUSH) : HOVER

        p.vx += ((dx / dist) * force + mouse.vx * WAKE) * falloff
        p.vy += ((dy / dist) * force + mouse.vy * WAKE) * falloff
      }
    }

    // Glow sprites rendered once per hue step, 5° apart, which is finer than
    // anyone can tell on something this small
    const sprites: HTMLCanvasElement[] = []

    function sprite(hue: number) {
      const index = Math.round((hue / 360) * SPRITE_HUES) % SPRITE_HUES

      if (sprites[index])
        return sprites[index]

      const s = document.createElement('canvas')
      const g = s.getContext('2d')!
      const r = SPRITE_SIZE / 2
      const h = (index / SPRITE_HUES) * 360

      s.width = SPRITE_SIZE
      s.height = SPRITE_SIZE

      // A hot pale centre, the old solid colour at the core's edge, then a
      // soft halo falling off to nothing
      const gradient = g.createRadialGradient(r, r, 0, r, r, r)

      gradient.addColorStop(0, `hsla(${h}, 100%, 80%, 1)`)
      gradient.addColorStop(GLOW_CORE, `hsla(${h}, 100%, 50%, 0.85)`)
      gradient.addColorStop(GLOW_CORE * 2, `hsla(${h}, 100%, 50%, 0.2)`)
      gradient.addColorStop(1, `hsla(${h}, 100%, 50%, 0)`)

      g.fillStyle = gradient
      g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
      sprites[index] = s

      return s
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      // Additive, so overlapping glows brighten each other
      ctx.globalCompositeOperation = 'lighter'

      for (const p of particles) {
        // Fade in quickly after birth, then burn out slowly over the rest
        const t = p.age / p.life
        const alpha = smoothstep(0, LIFE_FADE_IN, t) * (1 - smoothstep(LIFE_FADE_OUT, 1, t)) * lerp(DEPTH_ALPHA, p.depth)

        if (alpha <= 0)
          continue

        const hue = ((map(p.y, 0, height, hueRange + hueShift, -3 + hueShift) % 100) + 100) % 100
        const diameter = map(p.y, 0, height, PARTICLE_SIZE / 4, PARTICLE_SIZE) * lerp(DEPTH_SIZE, p.depth) * (1 - 0.3 * t)
        const radius = Math.max(0, diameter / 2) / GLOW_CORE

        // Stretch along the direction of travel, thinning as it goes so a
        // streak doesn't outshine a particle at rest
        const speed = Math.hypot(p.vx, p.vy)
        const stretch = 1 + Math.min(STREAK_MAX - 1, Math.max(0, speed - STREAK_FROM) * STREAK)
        const thin = 1 / Math.sqrt(stretch)
        const cos = speed > 0 ? p.vx / speed : 1
        const sin = speed > 0 ? p.vy / speed : 0

        ctx.globalAlpha = alpha
        ctx.setTransform(dpr * cos * stretch, dpr * sin * stretch, -dpr * sin * thin, dpr * cos * thin, dpr * p.x, dpr * p.y)
        ctx.drawImage(sprite(hue * 3.6), -radius, -radius, radius * 2, radius * 2)
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
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
      // Pick up from here, not from wherever the pointer was last seen
      if (!mouse.over && !mouse.down) {
        mouse.lastX = e.clientX
        mouse.lastY = e.clientY
      }

      mouse.x = e.clientX
      mouse.y = e.clientY

      // Touch has no hover, so a finger only counts while it's down
      mouse.over = e.pointerType !== 'touch'
    }

    function onPointerDown(e: PointerEvent) {
      onPointerMove(e)
      mouse.down = true
      mouse.right = e.button === 2
    }

    function onPointerUp() {
      mouse.down = false
    }

    function onPointerLeave() {
      mouse.over = false
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
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
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

      measure,
    }

    return () => {
      scene = null
      clearTimeout(fadeTimer)
      cancelAnimationFrame(raf)

      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  })

  // The logo is bound after this mounts, so measure whenever it shows up
  $effect(() => {
    if (obstacle)
      scene?.measure()
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
