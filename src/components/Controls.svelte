<script lang="ts">
  import { fade } from 'svelte/transition'

  interface Props {
    effects: boolean
    onToggle: () => void
  }

  const { effects, onToggle }: Props = $props()
</script>

<div class="controls noselect" in:fade>
  <button class="control" class:off={!effects} title="Toggle effects" onclick={onToggle}>fx</button>
</div>

<style lang="scss">
  @use "@/vars.scss" as vars;

  .controls {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    text-align: right;
    pointer-events: none;
    font-family: vars.$logo-font;
    z-index: 2;
    -webkit-font-smoothing: subpixel-antialiased;
  }

  .control {
    all: unset;
    margin-right: 8px;
    display: inline-block;
    text-align: center;
    width: 40px;
    height: 44px;
    font-size: 1em;
    color: vars.$muted-color;
    -webkit-text-stroke: 1px vars.$muted-color;
    border-left: 1px solid vars.$background-color;
    border-right: 1px solid vars.$background-color;
    border-top: 4px solid vars.$shadow-color;
    line-height: 44px;
    cursor: pointer;
    pointer-events: all;
    transition:
      color 0.25s ease-in-out,
      border 0.25s ease-in-out;

    &:hover,
    &:focus-visible {
      color: vars.$base-color;
      border-top: 4px solid vars.$base-color;
      -webkit-text-stroke: 1px vars.$base-color;
    }
  }
</style>
