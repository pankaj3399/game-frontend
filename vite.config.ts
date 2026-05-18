import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function shortSha(value: string): string {
  const trimmed = value.trim()
  return trimmed.length <= 7 ? trimmed : trimmed.slice(0, 7)
}

const trimmedViteCommitSha = process.env.VITE_COMMIT_SHA?.trim()
const commitShaFromVite =
  trimmedViteCommitSha && trimmedViteCommitSha.length > 0
    ? shortSha(trimmedViteCommitSha)
    : null

const trimmedVercelSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim()

const commitSha =
  commitShaFromVite ??
  (trimmedVercelSha && trimmedVercelSha.length > 0
    ? shortSha(trimmedVercelSha)
    : (() => {
        try {
          return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
        } catch {
          return 'dev'
        }
      })())

export default defineConfig({
  envPrefix: ['VITE_', 'REACT_APP_'],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commitSha),
  },

  plugins: [
    svgr({
      include: '**/*.svg?react',
      svgrOptions: {
        dimensions: false,
        replaceAttrValues: {
          white: 'currentColor',
          black: 'currentColor',
          '#fff': 'currentColor',
          '#ffffff': 'currentColor',
          '#000': 'currentColor',
          '#000000': 'currentColor',
          '#010A04': 'currentColor',
        },
      },
    }),
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
