import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Wichtig: Base-Pfad auf /interview/ setzen, damit Assets unter /interview/assets/... referenziert werden.
export default defineConfig({
  base: '/interview/',
  plugins: [react()],
})
