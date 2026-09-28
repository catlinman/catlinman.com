<script lang="ts">
  import type { ContentData } from '$types/Content'
  import Content from '$components/Content.svelte'

  const { data }: { data: ContentData } = $props()

  const sections = $derived(data.frontmatter.sections)

  const title = $derived(
    data.frontmatter.heading ? `Catlinman - ${data.frontmatter.heading}` : 'Catlinman',
  )
</script>

<svelte:head>
  <title>{title}</title>
  <meta property="og:title" content={title} />
  {#if data.frontmatter.description}
    <meta name="description" content={data.frontmatter.description} />
    <meta property="og:description" content={data.frontmatter.description} />
  {/if}
</svelte:head>

<Content html={data.html} {sections} gallery={data.frontmatter.gallery} />
