import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: …/airo-wp-chat-ui/
const pagesBase = '/airo-wp-chat-ui/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? pagesBase : '/',
  server: {
    port: 5175,
  },
}))


