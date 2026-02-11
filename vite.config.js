import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-sw',
      closeBundle() {
        copyFileSync('public/firebase-messaging-sw.js', 'dist/firebase-messaging-sw.js')
      }
    }
  ],
  build: {
    outDir: 'dist',
  }
})