import { loadNavItems } from '$lib/server/loadContent'

export const prerender = true
export const trailingSlash = 'always'

export async function load() {
  // The navigation bar is persistent, so it loads once here and not per page
  return { navItems: await loadNavItems() }
}
