<script lang="ts">
  import { resolve } from '$app/paths'
  import { fade, slide } from 'svelte/transition'

  interface Props {
    open: boolean
  }

  let { open = $bindable() }: Props = $props()

  const icons = [
    { name: 'twitter', title: 'Twitter', url: 'https://twitter.com/catllnman' },
    { name: 'facebook', title: 'Facebook', url: 'https://facebook.com/catllnman' },
    { name: 'youtube', title: 'YouTube', url: 'https://youtube.com/catlinman' },
    { name: 'github', title: 'GitHub', url: 'https://github.com/catlinman' },
    { name: 'steam', title: 'Steam', url: 'https://steamcommunity.com/id/catlinman' },
  ]
</script>

<footer>
  <button class="footer-handle" aria-expanded={open} aria-label="Toggle footer" onclick={() => (open = !open)}>
    <span class="footer-anchor noselect" class:open in:fade>^</span>
  </button>

  {#if open}
    <div class="footer-content" transition:slide>
      <p>
        Gotta go fast using <a href="https://svelte.dev">Svelte</a>, formerly <a href="https://github.com/catlinman/sanic.catlinman.com">Python and Sanic</a> &copy; <a href={resolve('/')}>Catlinman</a> 2013 - 2020
      </p>

      <a href="https://github.com/catlinman/catlinman.com">Source code available on GitHub</a>

      <div class="footer-icons">
        {#each icons as icon (icon.name)}
          <a class="icon-{icon.name}" title={icon.title} href={icon.url}></a>
        {/each}
      </div>
    </div>
  {/if}
</footer>

<style lang="scss">
  @use "@/vars.scss" as vars;

  footer {
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 2;
  }

  .footer-handle {
    all: unset;
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 24px;
    border-top: 1px solid vars.$background-color;
    background: linear-gradient(90deg, black, vars.$shadow-color, black);
    color: vars.$dim-color;
    text-align: center;
    text-shadow: 0px 0px 16px vars.$shadow-color;
    font-family: vars.$logo-font;
    font-size: 1.6em;
    line-height: 32px;
    cursor: pointer;
    transition: all 0.5s ease-in-out;

    &:hover,
    &:focus-visible {
      border-top: 1px solid vars.$dim-color;
      color: vars.$base-color;
      height: 32px;
      line-height: 44px;
      text-shadow: 0px 0px 64px vars.$base-color;
    }
  }

  .footer-anchor {
    display: inline-block;
    transition: transform 0.5s ease-in-out;

    &.open {
      transform: scaleY(-1) translate(0px, 10px);
    }
  }

  .footer-content {
    border-top: 1px solid vars.$background-color;
    background-color: vars.$shadow-color;
    font-size: 0.9em;
    text-transform: uppercase;

    p {
      margin: 0;
      padding-top: 1em;
      color: vars.$secondary-color;
    }

    > a {
      margin: 1em 0 0 0;
      display: inline-block;
    }
  }

  .footer-icons {
    padding-bottom: 4px;
    line-height: 30px;
    vertical-align: middle;

    a {
      display: inline-block;
      background-size: 20px;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 100%;
      border: solid 1px vars.$shadow-color;
      width: 24px;
      height: 24px;
      margin: 14px 8px;
      vertical-align: middle;
      transition: all 0.25s ease-in-out;

      &:hover {
        border: solid 1px vars.$base-color;
        box-shadow: 0px 0px 8px vars.$base-color;
      }

      @media all and (max-width: vars.$content-width-mobile) {
        background-size: 44px;
        width: 52px;
        height: 52px;
      }
    }
  }
</style>
