<script lang="ts">
  import { navigating } from '$app/state'
  import { onMount } from 'svelte'

  // A line under the navigation that grows out from the center while a page
  // loads. The old site drew it with two mirrored <progress> elements.

  let value = $state(0)
  let visible = $state(false)
  let target = 0
  let raf = 0

  function animate() {
    value += (target - value) * 0.05

    if (value < 99.75) {
      raf = requestAnimationFrame(animate)
      return
    }

    raf = 0
    visible = false
  }

  $effect(() => {
    const to = navigating.to

    // Loading jumps halfway and finishing runs the rest out. Heading back to
    // the landing page never showed a bar.
    if (to && to.url.pathname !== '/') {
      target = 50
      value = 0
      visible = true
    }
    else if (!to && visible) {
      target = 100
    }
    else {
      return
    }

    if (!raf)
      raf = requestAnimationFrame(animate)
  })

  onMount(() => () => cancelAnimationFrame(raf))
</script>

<div class="progress" class:visible style:transform="scaleX({value / 100})"></div>

<style lang="scss">
  @use "@/vars.scss" as vars;

  .progress {
    position: fixed;
    top: 48px;
    left: 0;
    width: 100%;
    height: 2px;
    z-index: 6;
    background: vars.$base-color;
    transform-origin: center;
    opacity: 0;
    transition: opacity 0.4s ease-in-out;

    &.visible {
      opacity: 1;
    }
  }
</style>
