import { useState, useEffect } from 'react'

function PlayerManagement({ apiUrl }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [kicking, setKicking] = useState(null)

  useEffect(() => {
    fetchPlayers()
    const interval = setInterval(fetchPlayers, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/players`)
      if (!response.ok) throw new Error('Failed to fetch players')
      const data = await response.json()
      setPlayers(data.players || [])
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const kickPlayer = async (userId, reason = '') => {
    setKicking(userId)
    try {
      const response = await fetch(`${apiUrl}/api/players/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to kick player')
      }

      await fetchPlayers()
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setKicking(null)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Player Management</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cs2-orange"></div>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No players connected
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-4 text-gray-400 font-semibold">Player</th>
                <th className="text-left py-2 px-4 text-gray-400 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.userId} className="border-b border-gray-800">
                  <td className="py-3 px-4 text-white">{player.name || `User ${player.userId}`}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => kickPlayer(player.userId)}
                      disabled={kicking === player.userId}
                      className="bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-200 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                    >
                      {kicking === player.userId ? 'Kicking...' : 'Kick'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PlayerManagement

