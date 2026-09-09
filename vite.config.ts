/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // unit tests in node; jsdom for component tests later
    include: ['src/tests/**/*.test.ts', 'src/tests/**/*.test.tsx'],
  },
})
