import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/api/queryClient'
import {
  seedPrerenderedTournaments,
} from '@/lib/prerender/seedTournaments'
import './i18n'
import './styles/globals.css'
import App from './App'

seedPrerenderedTournaments(queryClient)

/**
 * The production stylesheet loads async (see async-full-css in vite.config) so
 * the minimal boot shell in index.html can paint first. Don't let React replace
 * it with unstyled markup in the rare case JS beats CSS — wait briefly.
 */
function whenAppCssReady(): Promise<void> {
  const link = document.querySelector<HTMLLinkElement>('link[data-app-css]')
  if (!link || link.rel === 'stylesheet') return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    link.addEventListener('load', done, { once: true })
    link.addEventListener('error', done, { once: true })
    window.setTimeout(done, 3000)
  })
}

void whenAppCssReady().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
