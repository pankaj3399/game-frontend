import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'esnext',
    sourcemap: false,
    minify: 'esbuild',

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Order matters: more specific matches first (react-router before react)
          if (id.includes('react-router')) return 'router'
          // React core + small shared deps → framework (merged with vendor to avoid circular chunk)
          if (
            id.includes('react-dom') ||
            id.includes('scheduler') ||
            id.includes('/react/') ||
            id.includes('use-sync-external-store') ||
            id.includes('object-assign')
          ) {
            return 'framework'
          }

          if (id.includes('@tanstack')) return 'query'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'

          // Icons - often large; split for better caching
          if (id.includes('lucide-react')) return 'icons-lucide'
          if (id.includes('@hugeicons')) return 'icons-hugeicons'

          // Date utilities - used in SettingsForm (lazy page)
          if (id.includes('date-fns')) return 'date-fns'
          if (id.includes('react-day-picker')) return 'day-picker'

          // Toast/notifications
          if (id.includes('sonner')) return 'sonner'

          // Utilities
          if (id.includes('axios')) return 'axios'
          if (id.includes('zod')) return 'zod'

          // Catch-all bucket
          return 'framework'
        },
      },
    },

    chunkSizeWarningLimit: 500,
  },
})