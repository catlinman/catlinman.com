import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html', // GitHub Pages serves this for unknown routes, keeping the prerendered index.html intact
      precompress: true,
      strict: true,
    }),
    alias: {
      '$/*': 'src/*',
      '$components/*': 'src/components/*',
      '$scenes/*': 'src/scenes/*',
      '$types/*': 'src/types/*',
    },
  },
}
