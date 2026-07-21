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
    {
      name: 'preload-lcp-logo',
      transformIndexHtml(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) {
          // Dev server: point the static shell at the source asset.
          return html.replace(
            '__TB10_LOGO_SRC__',
            '/src/assets/icons/figma/misc/tb10-logo-frame8.svg',
          )
        }
        const logoAsset = Object.keys(bundle).find((key) =>
          key.includes('tb10-logo-frame8'),
        )
        if (!logoAsset) return html
        const href = logoAsset.startsWith('/') ? logoAsset : `/${logoAsset}`
        return html
          .replace('__TB10_LOGO_SRC__', href)
          .replace(
            '</head>',
            `    <link rel="preload" as="image" href="${href}" type="image/svg+xml" fetchpriority="high" />\n  </head>`,
          )
      },
    },
    {
      // Preconnect to the API origin so the first data fetch skips
      // DNS + TCP + TLS setup on real mobile networks.
      name: 'preconnect-api-origin',
      transformIndexHtml(html) {
        const apiUrl =
          process.env.REACT_APP_BACKEND_URL ??
          process.env.VITE_API_URL ??
          process.env.REACT_APP_API_URL
        if (!apiUrl) return html
        let origin: string
        try {
          origin = new URL(apiUrl).origin
        } catch {
          return html
        }
        return html.replace(
          '</head>',
          `    <link rel="preconnect" href="${origin}" crossorigin />\n  </head>`,
        )
      },
    },
    {
      // Module scripts never block rendering, but they do compete for
      // discovery/bandwidth priority when declared in <head>. Move the entry
      // script to the end of <body> so the boot shell (HTML + inline CSS +
      // logo) is unambiguously the first paint dependency.
      name: 'entry-script-to-body',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml(html) {
        const scripts: string[] = []
        html = html.replace(
          /<script type="module"[^>]*><\/script>\s*/g,
          (m) => {
            scripts.push(m.trim())
            return ''
          },
        )
        if (!scripts.length) return html
        return html.replace('</body>', `  ${scripts.join('\n  ')}\n  </body>`)
      },
    },
    {
      // First paint only needs the inline critical CSS in index.html, so the
      // full stylesheet must not block rendering. It always finishes long
      // before the JS bundle that produces the first styled React commit.
      name: 'async-full-css',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        for (const fileName of Object.keys(bundle)) {
          if (!fileName.endsWith('.css')) continue
          const hrefMarker = `href="/${fileName}"`
          const hrefIndex = html.indexOf(hrefMarker)
          if (hrefIndex === -1) continue
          const tagStart = html.lastIndexOf('<link', hrefIndex)
          const tagEnd = html.indexOf('>', hrefIndex)
          if (tagStart === -1 || tagEnd === -1) continue
          const asyncTags =
            `<link rel="preload" as="style" data-app-css href="/${fileName}" ` +
            `onload="this.onload=null;this.rel='stylesheet'" />` +
            `<noscript><link rel="stylesheet" href="/${fileName}" /></noscript>`
          html = html.slice(0, tagStart) + asyncTags + html.slice(tagEnd + 1)
        }
        return html
      },
    },
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

    modulePreload: {
      resolveDependencies(_filename, deps) {
        // Don't contend with critical JS for bandwidth on cold load.
        return deps.filter(
          (dep) =>
            !dep.includes('zod') &&
            !dep.includes('radix') &&
            !dep.includes('date-fns') &&
            !dep.includes('day-picker') &&
            !dep.includes('sonner'),
        )
      },
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // Order matters: more specific matches first (react-router before react)
          if (id.includes('react-router')) return 'router'
          // React core only — do not dump unrelated vendors into this chunk
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
          // Keep Slot (+ compose-refs) tiny and off the main radix chunk
          if (
            id.includes('@radix-ui/react-slot') ||
            id.includes('@radix-ui/react-compose-refs')
          ) {
            return 'radix-slot'
          }
          if (
            id.includes('@radix-ui') ||
            id.includes('node_modules/radix-ui') ||
            id.includes('node_modules/radix-ui/')
          ) {
            return 'radix'
          }
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'

          if (id.includes('date-fns')) return 'date-fns'
          if (id.includes('react-day-picker')) return 'day-picker'
          if (id.includes('sonner')) return 'sonner'
          if (id.includes('axios')) return 'axios'
          if (id.includes('zod')) return 'zod'

          // Let Rollup split remaining vendors; avoid inflating framework
        },
      },
    },

    chunkSizeWarningLimit: 500,
  },
})
