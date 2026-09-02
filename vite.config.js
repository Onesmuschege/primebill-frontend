import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Explicit automatic JSX runtime - without this, vitest's esbuild pipeline
  // compiles JSX to React.createElement (classic) and components crash with
  // "React is not defined" in the jsdom test environment.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})