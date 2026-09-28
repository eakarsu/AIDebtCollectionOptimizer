import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

const backendPort = process.env.SERVER_PORT || process.env.BACKEND_PORT || '3001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      }
    }
  }
})
