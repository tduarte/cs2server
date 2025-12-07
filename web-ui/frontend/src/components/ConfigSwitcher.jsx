import { useState } from 'react'

function ConfigSwitcher({ apiUrl }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const switchConfig = async (config) => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch(`${apiUrl}/api/config/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch config')
      }

      setMessage({ type: 'success', text: `Switched to ${config} config` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const configs = [
    { id: 'warmup', name: 'Warmup', description: 'Infinite money and ammo' },
    { id: 'competitive', name: 'Competitive', description: 'MR12 with overtime' },
    { id: 'competitive_workshop', name: 'Competitive Workshop', description: 'Competitive with workshop map' },
  ]

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Configuration</h2>
      <p className="text-gray-400 text-sm mb-4">Switch between server configurations</p>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-900/50 border border-green-500 text-green-100' 
            : 'bg-red-900/50 border border-red-500 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {configs.map((config) => (
          <button
            key={config.id}
            onClick={() => switchConfig(config.id)}
            disabled={loading}
            className="w-full bg-gray-900/50 hover:bg-gray-900 border border-gray-700 rounded-lg p-4 text-left transition-all hover:border-cs2-orange hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{config.name}</div>
                <div className="text-sm text-gray-400">{config.description}</div>
              </div>
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cs2-orange"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ConfigSwitcher

