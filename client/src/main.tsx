import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createTracedFetch,
  enableNetworkTrace,
  installNetworkTraceGlobal,
} from '@/diagnostics/networkTrace'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'
import './styles/theme.css'
import './styles/app-layout.css'
import './styles/marketing-layout.css'
import './styles/auth-layout.css'
import './styles/profile-settings.css'
import './styles/app-responsive.css'
import './styles/globals.css'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_NETWORK_TRACE === 'true') {
  window.fetch = createTracedFetch(window.fetch.bind(window))
  enableNetworkTrace(window.location.pathname)
  installNetworkTraceGlobal()
}

resetBodyScrollLock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
