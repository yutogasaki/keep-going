import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)

// PWA: Auto-update service worker registration
// Checks for new versions every hour so deployed updates reach users quickly
registerSW({
    onRegisteredSW(_swUrl, registration) {
        if (registration) {
            setInterval(() => {
                registration.update()
            }, 60 * 60 * 1000)
        }
    },
})
