import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://gdcorp-ux.github.io/airo-wp-chat-ui/
  base: process.env.GITHUB_PAGES === '1' ? '/airo-wp-chat-ui/' : '/',
  server: {
    port: 5175,
  },
})

