/**
 * Build-time prerender for GET /tournaments (guest default filters).
 *
 * Writes dist/tournaments/index.html with:
 * - Same boot shell as the SPA (navbar + logo) for instant FCP
 * - Real tournament rows when the API is reachable (LCP content)
 * - window.__TB10_PRERENDER__ so TanStack Query can seed without a cold fetch
 *
 * Soft-fails when REACT_APP_BACKEND_URL is missing or the API is unreachable
 * so local/CI builds never break — still emits the shell page.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = resolve(root, 'dist')
const outDir = resolve(distDir, 'tournaments')
const outFile = resolve(outDir, 'index.html')

const DEFAULT_FILTERS = { page: 1, limit: 10, when: 'future' }

function loadDotEnv() {
  const envPath = resolve(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatListDate(value) {
  if (!value || !String(value).trim()) return 'Unscheduled'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Unscheduled'
  try {
    return new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parsed)
  } catch {
    return 'Unscheduled'
  }
}

function backendBaseUrl() {
  return (
    process.env.REACT_APP_BACKEND_URL?.trim() ||
    process.env.VITE_API_URL?.trim() ||
    process.env.REACT_APP_API_URL?.trim() ||
    ''
  )
}

async function fetchTournaments(baseUrl) {
  const params = new URLSearchParams({
    page: String(DEFAULT_FILTERS.page),
    limit: String(DEFAULT_FILTERS.limit),
    when: DEFAULT_FILTERS.when,
  })
  const url = `${baseUrl.replace(/\/$/, '')}/api/tournaments?${params}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    if (!Array.isArray(data?.tournaments)) {
      throw new Error('Unexpected response shape')
    }
    return {
      tournaments: data.tournaments,
      pagination: data.pagination ?? {
        total: data.tournaments.length,
        page: DEFAULT_FILTERS.page,
        limit: DEFAULT_FILTERS.limit,
        totalPages: 1,
      },
      filters: DEFAULT_FILTERS,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function renderRows(tournaments) {
  if (!tournaments.length) {
    return `<p class="tb10-prerender-empty">No upcoming tournaments right now.</p>`
  }
  return `<ul class="tb10-prerender-list" role="list">${tournaments
    .map((t) => {
      const name = escapeHtml(t.name ?? 'Tournament')
      const club = escapeHtml(t.club?.name ?? '—')
      const date = escapeHtml(formatListDate(t.date))
      const href = escapeHtml(`/tournaments/${t.id}`)
      const live = t.isLive
        ? `<span class="tb10-prerender-live">Live</span>`
        : ''
      return `<li class="tb10-prerender-row">
  <a class="tb10-prerender-link" href="${href}">
    <span class="tb10-prerender-name">${name}${live}</span>
    <span class="tb10-prerender-meta">${club} · ${date}</span>
  </a>
</li>`
    })
    .join('\n')}</ul>`
}

function prerenderCss() {
  return `
      .tb10-prerender-main { flex: 1; width: 100%; max-width: 1440px; margin: 0 auto; padding: 16px 12px 32px; }
      @media (min-width: 1024px) { .tb10-prerender-main { padding: 24px 24px 40px; } }
      @media (min-width: 1280px) { .tb10-prerender-main { padding: 24px 72px 40px; } }
      .tb10-prerender-card { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px 16px; }
      @media (min-width: 640px) { .tb10-prerender-card { padding: 24px 20px; } }
      .tb10-prerender-title { margin: 0 0 16px; font-size: 1.5rem; font-weight: 600; color: #111827; line-height: 1.25; }
      .tb10-prerender-list { list-style: none; margin: 0; padding: 0; }
      .tb10-prerender-row { border-top: 1px solid #f3f4f6; }
      .tb10-prerender-row:first-child { border-top: 0; }
      .tb10-prerender-link { display: flex; flex-direction: column; gap: 4px; padding: 14px 4px; text-decoration: none; color: inherit; }
      .tb10-prerender-name { font-size: 0.95rem; font-weight: 600; color: #111827; }
      .tb10-prerender-live { display: inline-block; margin-left: 8px; padding: 1px 6px; border-radius: 4px; background: #d92100; color: #fff; font-size: 0.7rem; font-weight: 600; vertical-align: middle; }
      .tb10-prerender-meta { font-size: 0.8rem; color: #6b7280; }
      .tb10-prerender-empty { margin: 24px 0; text-align: center; color: #6b7280; }
      .tb10-boot-shell { display: flex; flex-direction: column; min-height: 100vh; }
  `
}

function buildRootMarkup(payload) {
  const listBody = payload
    ? renderRows(payload.tournaments ?? [])
    : `<div class="tb10-prerender-empty" aria-hidden="true"></div>`
  return `<div class="tb10-boot-shell">
        <header class="tb10-boot-header">
          <div class="tb10-boot-header-inner">
            <img
              src="__TB10_LOGO_SRC__"
              alt="TB10 v1.6"
              width="144"
              height="28"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </header>
        <main class="tb10-prerender-main">
          <div class="tb10-prerender-card">
            <h1 class="tb10-prerender-title">Tournaments</h1>
            ${listBody}
          </div>
        </main>
      </div>`
}

function injectIntoTemplate(templateHtml, rootMarkup, payload) {
  let html = templateHtml

  // Ensure prerender-specific critical CSS is present.
  if (!html.includes('.tb10-prerender-main')) {
    html = html.replace('</style>', `${prerenderCss()}\n    </style>`)
  }

  html = html.replace(
    /<title>[^<]*<\/title>/,
    '<title>Tournaments · TB10</title>',
  )

  // Replace the entire #root inner content (boot shell → list shell).
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>\s*(?=<script)/,
    `<div id="root">\n      ${rootMarkup}\n    </div>\n    `,
  )

  if (payload) {
    const json = JSON.stringify(payload).replace(/</g, '\\u003c')
    const script = `<script>window.__TB10_PRERENDER__=${json};</script>`
    html = html.replace('</body>', `  ${script}\n  </body>`)
  }

  return html
}

async function main() {
  loadDotEnv()

  if (!existsSync(distDir)) {
    console.error('[prerender] dist/ missing — run vite build first')
    process.exit(1)
  }

  const templatePath = resolve(distDir, 'index.html')
  if (!existsSync(templatePath)) {
    console.error('[prerender] dist/index.html missing')
    process.exit(1)
  }

  const template = readFileSync(templatePath, 'utf8')
  // Resolve logo src from the already-transformed SPA index.html.
  const logoMatch = template.match(
    /src="(\/assets\/tb10-logo-frame8[^"]+)"/,
  )
  const logoSrc = logoMatch?.[1] ?? '/assets/tb10-logo-frame8.svg'

  let payload = null
  const base = backendBaseUrl()
  if (base) {
    try {
      payload = await fetchTournaments(base)
      console.log(
        `[prerender] fetched ${payload.tournaments.length} tournaments from ${base}`,
      )
    } catch (err) {
      console.warn(
        `[prerender] API fetch failed (${err instanceof Error ? err.message : err}) — emitting shell without data`,
      )
    }
  } else {
    console.warn(
      '[prerender] REACT_APP_BACKEND_URL not set — emitting shell without data',
    )
  }

  let rootMarkup = buildRootMarkup(payload)
  rootMarkup = rootMarkup.replaceAll('__TB10_LOGO_SRC__', logoSrc)

  const html = injectIntoTemplate(template, rootMarkup, payload)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outFile, html, 'utf8')
  console.log(`[prerender] wrote ${outFile}`)
}

main().catch((err) => {
  console.error('[prerender] unexpected failure', err)
  process.exit(1)
})
