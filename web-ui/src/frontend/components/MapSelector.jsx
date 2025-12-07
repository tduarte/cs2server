import { useState } from 'react'

function MapSelector({ apiUrl }) {
  const [selectedMap, setSelectedMap] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const commonMaps = [
    'de_ancient',
    'de_anubis',
    'de_inferno',
    'de_mirage',
    'de_nuke',
    'de_overpass',
    'de_vertigo',
    'de_cache',
    'de_dust2',
  ]

  const changeMap = async (map) => {
    if (!map || loading) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`${apiUrl}/api/maps/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ map }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change map')
      }

      setMessage({ type: 'success', text: `Changing map to ${map}...` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleCustomMap = (e) => {
    e.preventDefault()
    if (selectedMap.trim()) {
      changeMap(selectedMap.trim())
      setSelectedMap('')
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Map Management</h2>
      <p className="text-gray-400 text-sm mb-4">Change the current map</p>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-900/50 border border-green-500 text-green-100' 
            : 'bg-red-900/50 border border-red-500 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {commonMaps.map((map) => (
          <button
            key={map}
            onClick={() => changeMap(map)}
            disabled={loading}
            className="bg-gray-900/50 hover:bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm transition-all hover:border-cs2-orange disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {map.replace('de_', '').toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomMap} className="flex gap-2">
        <input
          type="text"
          value={selectedMap}
          onChange={(e) => setSelectedMap(e.target.value)}
          placeholder="Custom map name (e.g., de_dust2)"
          className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-orange text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !selectedMap.trim()}
          className="bg-cs2-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Change
        </button>
      </form>
    </div>
  )
}

export default MapSelector

