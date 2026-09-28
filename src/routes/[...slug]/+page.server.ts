import type { EntryGenerator, PageServerLoad } from './$types'
import { listSlugs, loadContent } from '$lib/server/loadContent'

export const load: PageServerLoad = async ({ params }) => {
  // With trailingSlash always, the rest parameter keeps the slash (about/)
  return await loadContent(params.slug.replace(/\/$/, ''))
}

export const entries: EntryGenerator = async () => {
  return (await listSlugs()).map(slug => ({ slug }))
}
