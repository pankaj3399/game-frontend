/**
 * Build-time prerender for GET /tournaments (guest default filters).
 *
 * Writes dist/tournaments/index.html with:
 * - Same boot shell as the SPA (navbar matching AppNavbar guest chrome)
 * - Real tournament rows when the API is reachable (LCP content)
 * - window.__TB10_PRERENDER__ so TanStack Query can seed without a cold fetch
 *
 * Soft-fails when REACT_APP_BACKEND_URL is missing or the API is unreachable
 * so local/CI builds never break — still emits the shell page.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
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
      generatedAt: Date.now(),
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
      const initial = escapeHtml(
        String(t.club?.name ?? '?').trim().charAt(0).toUpperCase() || '?',
      )
      const logo = typeof t.club?.logoUrl === 'string' ? t.club.logoUrl.trim() : ''
      const badge = logo
        ? `<span class="tb10-prerender-badge" aria-hidden="true"><img src="${escapeHtml(logo)}" alt="" loading="lazy" decoding="async" /></span>`
        : `<span class="tb10-prerender-badge" aria-hidden="true"><span class="tb10-prerender-initial">${initial}</span></span>`
      return `<li class="tb10-prerender-row">
  <a class="tb10-prerender-link" href="${href}">
    ${badge}
    <span class="tb10-prerender-copy">
      <span class="tb10-prerender-name">${name}${live}</span>
      <span class="tb10-prerender-meta">${club}</span>
      <span class="tb10-prerender-date">${date}</span>
    </span>
  </a>
</li>`
    })
    .join('\n')}</ul>`
}

/** Navbar critical CSS — only emitted on the prerendered /tournaments page. */
function bootHeaderCss() {
  return `
      .tb10-boot-shell { display: flex; flex-direction: column; min-height: 100vh; background: #f8fbf8; }
      .tb10-boot-header { position: sticky; top: 0; z-index: 50; height: 56px; width: 100%; background: #067429; }
      .tb10-boot-header-inner {
        position: relative;
        margin: 0 auto;
        display: grid;
        height: 100%;
        width: 100%;
        max-width: 1440px;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 0 8px;
        padding: 0 12px;
      }
      .tb10-boot-logo { display: block; height: 28px; width: auto; }
      .tb10-boot-title {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 3.75rem;
        margin: 0;
        min-width: 0;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 21px;
        font-weight: 600;
        line-height: 1.15;
        color: #ffdc4a;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tb10-boot-nav { display: none; }
      .tb10-boot-actions { position: relative; z-index: 10; display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
      .tb10-boot-login {
        display: none;
        height: 32px;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-radius: 8px;
        background: #ffdc4a;
        padding: 0 12px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: #010a04;
        text-decoration: none;
        white-space: nowrap;
      }
      .tb10-boot-menu {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        background: transparent;
        color: #fff;
      }
      .tb10-boot-menu svg { display: block; width: 30px; height: 30px; }
      .tb10-boot-lang {
        display: none;
        height: 32px;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        padding: 0 10px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #fff;
      }
      @media (min-width: 640px) {
        .tb10-boot-title { padding-left: 5.5rem; padding-right: 5.5rem; font-size: 23px; }
      }
      @media (min-width: 768px) {
        .tb10-boot-logo { height: 33px; }
      }
      @media (min-width: 1024px) {
        .tb10-boot-header { height: 60px; }
        .tb10-boot-header-inner { padding: 0 24px; gap: 0 8px; }
        .tb10-boot-title { display: none; }
        .tb10-boot-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 0;
          overflow: hidden;
        }
        .tb10-boot-nav a {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          white-space: nowrap;
        }
        .tb10-boot-nav a[aria-current="page"] { color: #fff; }
        .tb10-boot-menu { display: none; }
        .tb10-boot-lang { display: inline-flex; }
        .tb10-boot-login { display: inline-flex; height: 34px; padding: 0 20px; font-size: 14px; }
      }
      @media (min-width: 1280px) {
        .tb10-boot-header-inner { padding: 0 72px; gap: 0 12px; }
        .tb10-boot-logo { height: 39px; }
        .tb10-boot-nav { gap: 16px; }
        .tb10-boot-nav a { font-size: 13px; gap: 6px; }
      }
  `
}

function prerenderCss() {
  return `
      .tb10-prerender-page {
        display: flex;
        min-height: calc(100vh - 56px);
        flex-direction: column;
        background: #f8fbf8;
      }
      @media (min-width: 1024px) {
        .tb10-prerender-page { min-height: calc(100vh - 60px); }
      }
      .tb10-prerender-main {
        margin: 0 auto;
        width: 100%;
        max-width: 440px;
        flex: 1;
        padding: 24px 12px 24px;
      }
      @media (min-width: 640px) {
        .tb10-prerender-main { max-width: none; padding: 28px 16px 32px; }
      }
      @media (min-width: 1024px) {
        .tb10-prerender-main { max-width: 1060px; padding: 32px 24px; }
      }
      .tb10-prerender-card {
        overflow: hidden;
        border-radius: 12px;
        border: 1px solid rgba(1, 10, 4, 0.08);
        background: #fff;
        box-shadow: 0 3px 15px 0 rgba(0, 0, 0, 0.06);
      }
      .tb10-prerender-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 20px 16px 16px;
      }
      @media (min-width: 640px) {
        .tb10-prerender-toolbar { padding: 20px 20px 16px; }
      }
      @media (min-width: 1024px) {
        .tb10-prerender-toolbar {
          align-items: flex-start;
          gap: 24px;
          padding: 16px 20px;
        }
      }
      .tb10-prerender-heading {
        display: none;
        margin: 0;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        line-height: 1.25;
        color: #111827;
      }
      @media (min-width: 1024px) {
        .tb10-prerender-heading { display: block; }
      }
      .tb10-prerender-filters {
        display: inline-flex;
        height: 36px;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        border: 1px solid rgba(1, 10, 4, 0.12);
        background: #fff;
        padding: 0 12px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #010a04;
      }
      @media (min-width: 1024px) {
        .tb10-prerender-filters { margin-left: auto; }
      }
      .tb10-prerender-list { list-style: none; margin: 0; padding: 0; }
      .tb10-prerender-row { border-top: 1px solid #f3f4f6; }
      .tb10-prerender-link {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        text-decoration: none;
        color: inherit;
      }
      @media (min-width: 640px) {
        .tb10-prerender-link { padding: 16px 20px; }
      }
      .tb10-prerender-badge {
        display: flex;
        height: 36px;
        width: 36px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.15);
      }
      .tb10-prerender-badge img { height: 100%; width: 100%; object-fit: cover; }
      .tb10-prerender-initial {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 10px;
        font-weight: 600;
        color: #6a6a6a;
      }
      .tb10-prerender-copy {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        gap: 2px;
      }
      .tb10-prerender-name {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: #111827;
      }
      .tb10-prerender-live {
        display: inline-block;
        margin-left: 8px;
        padding: 1px 6px;
        border-radius: 4px;
        background: #d92100;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 600;
        vertical-align: middle;
      }
      .tb10-prerender-meta,
      .tb10-prerender-date {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        font-size: 0.8rem;
        color: #6b7280;
      }
      .tb10-prerender-empty {
        margin: 0;
        padding: 40px 16px;
        text-align: center;
        color: #6b7280;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      }
  `
}

function buildBootHeader() {
  return `<header class="tb10-boot-header">
          <div class="tb10-boot-header-inner">
            <a class="tb10-boot-logo-link" href="/tournaments" aria-label="TB10 Home" style="position:relative;z-index:10;display:inline-flex;align-items:center">
              <img
                class="tb10-boot-logo"
                src="__TB10_LOGO_SRC__"
                alt="TB10 v1.6"
                width="144"
                height="28"
                fetchpriority="high"
                decoding="async"
              />
            </a>
            <p class="tb10-boot-title">Tournaments</p>
            <nav class="tb10-boot-nav" aria-label="Primary">
              <a href="/tournaments" aria-current="page">Tournaments</a>
              <a href="/my-score">My Score</a>
              <a href="/record-score">Record Score</a>
              <a href="/profile">Settings</a>
              <a href="/clubs">Clubs</a>
              <a href="/sponsors">TB10 Sponsors</a>
              <a href="/about">About TB10</a>
            </nav>
            <div class="tb10-boot-actions">
              <span class="tb10-boot-lang" aria-hidden="true">EN</span>
              <a class="tb10-boot-login" href="/login">Log In</a>
              <span class="tb10-boot-menu" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </span>
            </div>
          </div>
        </header>`
}

function buildRootMarkup(payload) {
  const listBody = payload
    ? renderRows(payload.tournaments ?? [])
    : `<div class="tb10-prerender-empty" aria-hidden="true"></div>`
  return `<div class="tb10-boot-shell">
        ${buildBootHeader()}
        <div class="tb10-prerender-page">
          <main class="tb10-prerender-main">
            <div class="tb10-prerender-card">
              <div class="tb10-prerender-toolbar">
                <h1 class="tb10-prerender-heading">Tournaments</h1>
                <span class="tb10-prerender-filters">Filters</span>
              </div>
              ${listBody}
            </div>
          </main>
        </div>
      </div>`
}

function injectIntoTemplate(templateHtml, rootMarkup, payload, logoSrc) {
  let html = templateHtml

  // Navbar + list critical CSS lives only on the prerendered tournaments page.
  if (!html.includes('.tb10-prerender-main')) {
    html = html.replace(
      '</style>',
      `${bootHeaderCss()}${prerenderCss()}\n    </style>`,
    )
  }

  if (logoSrc) {
    html = html.replace(
      '</head>',
      `    <link rel="preload" as="image" href="${logoSrc}" type="image/svg+xml" fetchpriority="high" />\n  </head>`,
    )
  }

  html = html.replace(
    /<title>[^<]*<\/title>/,
    '<title>Tournaments · TB10</title>',
  )

  // Replace the entire #root inner content (boot shell → list shell).
  const rootPattern = /<div id="root">[\s\S]*?<\/div>\s*(?=<script)/
  if (!rootPattern.test(html)) {
    throw new Error(
      '[prerender] could not locate <div id="root">…</div> before <script> in dist/index.html',
    )
  }
  html = html.replace(
    rootPattern,
    `<div id="root">\n      ${rootMarkup}\n    </div>\n    `,
  )

  if (payload) {
    const json = JSON.stringify(payload).replace(/</g, '\\u003c')
    const script = `<script>window.__TB10_PRERENDER__=${json};</script>`
    html = html.replace('</body>', `  ${script}\n  </body>`)
  }

  return html
}

function findLogoAsset() {
  const assetsDir = resolve(distDir, 'assets')
  if (!existsSync(assetsDir)) return '/assets/tb10-logo-frame8.svg'
  const match = readdirSync(assetsDir).find((name) =>
    name.includes('tb10-logo-frame8'),
  )
  return match ? `/assets/${match}` : '/assets/tb10-logo-frame8.svg'
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
  const logoSrc = findLogoAsset()

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

  const html = injectIntoTemplate(template, rootMarkup, payload, logoSrc)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(outFile, html, 'utf8')
  console.log(`[prerender] wrote ${outFile}`)
}

main().catch((err) => {
  console.error('[prerender] unexpected failure', err)
  process.exit(1)
})
