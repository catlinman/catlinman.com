<script lang="ts">
  import type { LightboxItem } from '$types/Content'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  interface Props {
    items: LightboxItem[]
    index: number
    onClose: () => void
  }

  let { items, index = $bindable(), onClose }: Props = $props()

  const item = $derived(items[index])

  let dialog: HTMLDivElement

  function step(direction: number) {
    index = (index + direction + items.length) % items.length
  }

  // Buttons sit on the backdrop, which closes the lightbox when clicked
  function onArrow(e: MouseEvent, direction: number) {
    e.stopPropagation()
    step(direction)
  }

  onMount(() => {
    // The layout closes the page on escape. Listening in the capture phase and
    // stopping the event means escape only closes the lightbox.
    function onKeyUp(e: KeyboardEvent) {
      if (e.key !== 'Escape')
        return

      e.stopPropagation()
      onClose()
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')
        step(-1)
      else if (e.key === 'ArrowRight')
        step(1)
    }

    window.addEventListener('keyup', onKeyUp, { capture: true })
    window.addEventListener('keydown', onKeyDown)
    document.documentElement.style.overflow = 'hidden'
    dialog.focus()

    return () => {
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = ''
    }
  })
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="lightbox" role="dialog" aria-modal="true" aria-label={item.title} tabindex="-1" bind:this={dialog} transition:fade={{ duration: 200 }} onclick={onClose}>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <figure onclick={e => e.stopPropagation()}>
    {#key index}
      <div class="media" in:fade={{ duration: 200 }}>
        {#if item.video}
          <!-- YouTube only loads once someone opens a video -->
          <iframe
            src="https://www.youtube-nocookie.com/embed/{item.video}?autoplay=1&rel=0"
            title={item.title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else}
          <img src={item.src} alt={item.title} />
        {/if}
      </div>
    {/key}

    <figcaption>
      {item.title}

      {#if items.length > 1}
        <span class="count">{index + 1} / {items.length}</span>
      {/if}
    </figcaption>
  </figure>

  {#if items.length > 1}
    <button class="arrow prev" aria-label="Previous" onclick={e => onArrow(e, -1)}>&lsaquo;</button>
    <button class="arrow next" aria-label="Next" onclick={e => onArrow(e, 1)}>&rsaquo;</button>
  {/if}

  <button class="close" aria-label="Close" onclick={onClose}>&times;</button>
</div>

<style lang="scss">
  @use "@/vars.scss" as vars;

  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(13, 13, 13, 0.95);
    cursor: zoom-out;
    outline: none;
  }

  figure {
    margin: 0;
    cursor: default;
    max-width: 90vw;
  }

  .media {
    display: flex;
    justify-content: center;
  }

  img {
    display: block;
    max-width: 90vw;
    max-height: 80vh;
    border: 1px solid vars.$dim-color;
    box-shadow: 0px 0px 32px vars.$shadow-color;
  }

  iframe {
    display: block;
    width: min(90vw, 1280px, calc(80vh * 16 / 9));
    aspect-ratio: 16 / 9;
    border: 1px solid vars.$dim-color;
  }

  figcaption {
    margin-top: 16px;
    font-family: vars.$logo-font;
    font-size: 1.2em;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: vars.$base-color;
    -webkit-text-stroke: 1px vars.$base-color;

    .count {
      margin-left: 16px;
      color: vars.$muted-color;
      -webkit-text-stroke: 1px vars.$muted-color;
    }
  }

  button {
    all: unset;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    font-family: vars.$logo-font;
    font-size: 3em;
    line-height: 1;
    color: vars.$muted-color;
    cursor: pointer;
    transition:
      color 0.12s ease-in-out,
      text-shadow 0.12s ease-in-out;

    &:hover,
    &:focus-visible {
      color: vars.$base-color;
      text-shadow: 0px 0px 16px vars.$base-glow;
    }
  }

  .prev {
    left: 16px;
    top: calc(50% - 24px);
  }

  .next {
    right: 16px;
    top: calc(50% - 24px);
  }

  .close {
    top: 16px;
    right: 16px;
  }
</style>
