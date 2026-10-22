/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
})
