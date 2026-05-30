import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O proxy encaminha /api para o backend FastAPI (porta 8000),
// evitando problemas de CORS durante o desenvolvimento.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
