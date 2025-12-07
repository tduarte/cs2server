import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import ConfigSwitcher from './components/ConfigSwitcher'
import RconConsole from './components/RconConsole'
import PlayerManagement from './components/PlayerManagement'
import MapSelector from './components/MapSelector'
import ServerPassword from './components/ServerPassword'
import ServerConnect from './components/ServerConnect'
import QuickCommands from './components/QuickCommands'
import './App.css'

// Use relative URL - backend serves frontend and handles /api routes
const API_URL = import.meta.env.VITE_API_URL || ''

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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.details || `Server returned ${response.status}`)
      }
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
    <div className="min-h-screen bg-gradient-to-br from-cs2-darker via-cs2-dark to-gray-900 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-cs2-orange/10 p-2 rounded-lg">
              <svg className="w-6 h-6 text-cs2-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              CS2 Server Manager
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            {serverStatus ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Offline
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cs2-orange"></div>
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto bg-red-900/20 border border-red-500/50 text-red-100 px-6 py-4 rounded-xl mb-8 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-lg mb-1">Connection Error</h3>
                <p className="text-red-200/80 mb-3">{error}</p>
                {error.includes('Failed to connect') && (
                  <div className="text-sm bg-red-950/30 p-3 rounded-lg border border-red-500/20">
                    <p className="font-medium mb-2 text-red-200">Troubleshooting:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-300/80 ml-1">
                      <li>Wait for server startup (10-15 mins initial download)</li>
                      <li>Check RCON password in .env file</li>
                      <li>Verify containers are running</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {serverStatus && !loading && (
          <div className="space-y-8">
            {/* Status Overview */}
            <section>
              <Dashboard status={serverStatus} />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Main Controls Column */}
              <div className="xl:col-span-8 space-y-8">
                {/* Quick Actions Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ConfigSwitcher apiUrl={API_URL} />
                  <MapSelector apiUrl={API_URL} />
                </div>

                {/* Management Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Player Management
                  </h2>
                  <PlayerManagement apiUrl={API_URL} />
                </div>

                {/* Console Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Server Console
                  </h2>
                  <RconConsole apiUrl={API_URL} />
                </div>
              </div>

              {/* Sidebar Column */}
              <div className="xl:col-span-4 space-y-8">
                <div className="sticky top-24 space-y-6">
                  <ServerConnect apiUrl={API_URL} />
                  <ServerPassword apiUrl={API_URL} />
                  <QuickCommands apiUrl={API_URL} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
