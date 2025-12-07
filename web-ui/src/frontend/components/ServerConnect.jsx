import { useState, useEffect } from 'react'

function ServerConnect({ apiUrl }) {
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [customIP, setCustomIP] = useState('')

  useEffect(() => {
    fetchConnectionInfo()
  }, [])

  const fetchConnectionInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/server/connection`)
      if (!response.ok) throw new Error('Failed to fetch connection info')
      const data = await response.json()
      setConnectionInfo(data)
      setCustomIP(data.ip || 'localhost')
    } catch (error) {
      console.error('Error fetching connection info:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConnectionString = () => {
    if (!connectionInfo) return ''
    const ip = customIP || connectionInfo.ip || 'localhost'
    const port = connectionInfo.port || 27015
    const password = connectionInfo.password || ''
    
    if (password) {
      return `connect ${ip}:${port}; password ${password}`
    }
    return `connect ${ip}:${port}`
  }

  const getSteamURL = () => {
    if (!connectionInfo) return ''
    const ip = customIP || connectionInfo.ip || 'localhost'
    const port = connectionInfo.port || 27015
    const password = connectionInfo.password || ''
    
    if (password) {
      return `steam://connect/${ip}:${port}/${password}`
    }
    return `steam://connect/${ip}:${port}`
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('Fallback copy failed:', e)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleSteamConnect = () => {
    const url = getSteamURL()
    window.location.href = url
  }

  const handleCopyCommand = () => {
    const command = getConnectionString()
    copyToClipboard(command)
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cs2-orange"></div>
        </div>
      </div>
    )
  }

  if (!connectionInfo) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
        <p className="text-gray-400">Unable to load connection info</p>
      </div>
    )
  }

  const ip = customIP || connectionInfo.ip || 'localhost'
  const port = connectionInfo.port || 27015

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Connect to Server</h2>
      <p className="text-gray-400 text-sm mb-4">
        Quick connect options for CS2 client
      </p>

      <div className="space-y-4">
        {/* Server Info */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Server Address</div>
              <div className="text-white font-mono">{ip}:{port}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Password</div>
              <div className="text-white">
                {connectionInfo.hasPassword ? (
                  <span className="text-yellow-400">Required</span>
                ) : (
                  <span className="text-green-400">None (Public)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Custom IP Input */}
        <div>
          <label htmlFor="custom-ip" className="block text-sm font-medium text-gray-300 mb-2">
            Custom IP Address (optional)
          </label>
          <input
            type="text"
            id="custom-ip"
            value={customIP}
            onChange={(e) => setCustomIP(e.target.value)}
            placeholder="localhost or your server IP"
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-orange text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">
            Use this if connecting from a different machine on your network
          </p>
        </div>

        {/* Connection Methods */}
        <div className="space-y-2">
          <button
            onClick={handleSteamConnect}
            className="w-full bg-cs2-orange hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7l-7-5z"/>
            </svg>
            Connect via Steam
          </button>

          <button
            onClick={handleCopyCommand}
            className="w-full bg-gray-900/50 hover:bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Console Command
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 text-sm text-blue-200">
          <div className="font-semibold mb-1">How to use:</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Steam Connect:</strong> Click the button to launch CS2 and connect</li>
            <li><strong>Console Command:</strong> Copy the command, open CS2 console (~), paste and press Enter</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ServerConnect

