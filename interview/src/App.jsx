
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    const el = document.getElementById('root')
    // Prefer CDN script already included in index.html; fallback guard:
    const mount = () => {
      if (window.ChatKit && el) {
        window.ChatKit.mount({
          element: el,
          workflow: import.meta.env.VITE_WORKFLOW_ID,
          version: import.meta.env.VITE_WORKFLOW_VERSION,
        })
      }
    }
    if (window.ChatKit) mount()
    else window.addEventListener('chatkit:ready', mount, { once: true })
    return () => {}
  }, [])
  return null
}
