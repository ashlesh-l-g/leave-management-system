import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Every request the browser makes to /api is forwarded to the Spring Boot
// backend by the Vite dev server. That means the frontend never needs to know
// the backend URL and the browser never makes a cross-origin request.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
