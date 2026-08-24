import { useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

function App() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null)

  async function checkBackendHealth() {
    setHealthStatus('Checking…')
    try {
      const base = API_BASE.replace(/\/api\/v1\/?$/, '')
      const res = await fetch(`${base}/actuator/health`)
      const data = await res.json()
      setHealthStatus(data.status === 'UP' ? 'Backend is UP' : `Backend status: ${data.status}`)
    } catch {
      setHealthStatus('Backend unreachable (start backend on port 8080)')
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">MedVision AI</p>
        <h1>Intelligent Medical Image Analysis</h1>
        <p className="subtitle">
          Final-year project platform — React frontend scaffold ready for Phase 1 implementation.
        </p>
        <div className="actions">
          <button type="button" onClick={checkBackendHealth}>
            Check Backend Health
          </button>
        </div>
        {healthStatus && <p className="status">{healthStatus}</p>}
      </header>
    </main>
  )
}

export default App
