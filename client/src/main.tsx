import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { resetBodyScrollLock } from '@/lib/bodyScrollLock'
import { warnIfProductionMisconfigured } from '@/lib/env'
import './styles/theme.css'
import './styles/app-layout.css'
import './styles/audit-report.css'
import './styles/marketing-layout.css'
import './styles/auth-layout.css'
import './styles/profile-settings.css'
import './styles/app-responsive.css'
import './styles/globals.css'
import './index.css'
import App from './App.tsx'

resetBodyScrollLock()
warnIfProductionMisconfigured()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
