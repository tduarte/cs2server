import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import ConfigSwitcher from './components/ConfigSwitcher'
import RconConsole from './components/RconConsole'
import PlayerManagement from './components/PlayerManagement'
import MapSelector from './components/MapSelector'
import './App.css'

// Use relative URL in production (nginx proxies /api to backend)
// Use environment variable for development
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001')

function App() {
  const [serverStatus, setServerStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`)
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setServerStatus(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cs2-darker via-cs2-dark to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            CS2 Server Management
          </h1>
          <p className="text-gray-400">Manage your Counter-Strike 2 dedicated server</p>
        </header>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cs2-orange"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
            Error: {error}
          </div>
        )}

        {serverStatus && (
          <>
            <Dashboard status={serverStatus} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ConfigSwitcher apiUrl={API_URL} />
              <MapSelector apiUrl={API_URL} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <PlayerManagement apiUrl={API_URL} />
              <RconConsole apiUrl={API_URL} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App

