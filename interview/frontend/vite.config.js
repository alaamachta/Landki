import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Configure base path so production assets are served under /interview/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/interview/' : '/',
  plugins: [react()],
}))
