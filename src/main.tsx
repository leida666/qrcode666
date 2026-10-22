import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { App } from './App'
import { langFromPath } from './i18n'
import { pageFromPath } from './pages'
import './styles.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App lang={langFromPath(location.pathname)} page={pageFromPath(location.pathname)} />
  </StrictMode>
)

// Production pages are pre-rendered (see scripts/prerender.mjs); dev renders from scratch.
if (container.hasChildNodes()) hydrateRoot(container, app)
else createRoot(container).render(app)
