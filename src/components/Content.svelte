<script lang="ts">
  import type { Section } from '$types/Content'
  import { onTableClick, prepareTables } from '$lib/client/tables'

  interface Props {
    html: string
    sections?: Section[]
  }

  const { html, sections = [] }: Props = $props()

  let container: HTMLDivElement | undefined = $state()

  $effect(() => {
    if (container && html)
      prepareTables(container)
  })
</script>

{#if sections.length}
  <div class="content-navigation">
    {#each sections as section, i (section.id)}
      {#if i > 0}&middot;{/if}
      <a href="#{section.id}">{section.name}</a>
    {/each}
  </div>
{/if}

<div class="dim-contained"></div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="content-contained" class:with-sections={sections.length} bind:this={container} onclick={onTableClick}>
  <span id="top"></span>

  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</div>

<style lang="scss">
  @use "@/vars.scss" as vars;

  .content-navigation {
    position: fixed;
    top: 50px;
    left: 0;
    width: 100%;
    padding: 4px 0;
    z-index: 1;
    text-transform: uppercase;
    font-size: 0.8em;
    line-height: 24px;
    color: vars.$base-color;
    text-align: center;
    border-top: 1px solid vars.$dim-color;
    border-bottom: 1px solid vars.$dim-color;
    background: linear-gradient(90deg, vars.$shadow-color, vars.$background-color, vars.$shadow-color);

    a {
      margin: 0px 8px;
      display: inline-block;
      cursor: pointer;
    }
  }

  .dim-contained {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    max-width: vars.$content-width;
    background: linear-gradient(0deg, vars.$background-color, vars.$shadow-color);
    opacity: 0.975;
    z-index: 0;
  }

  // Room for the section bar, the old markup used two <br /> tags
  .with-sections {
    padding-top: 36px;
  }

  #top {
    position: absolute;
    top: 0;
  }
</style>
