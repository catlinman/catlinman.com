import path from 'node:path'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    sveltekit(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '$': path.resolve(import.meta.dirname, './src'),
      '$components': path.resolve(import.meta.dirname, './src/components'),
      '$scenes': path.resolve(import.meta.dirname, './src/scenes'),
      '$types': path.resolve(import.meta.dirname, './src/types'),
    },
  },
})
