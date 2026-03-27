import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-blockly': ['blockly', 'react-blockly'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts'],
          'vendor-utils': ['lodash', 'moment', 'date-fns', 'zod'],
          'vendor-three': ['three'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
