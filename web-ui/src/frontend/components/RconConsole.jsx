import { useState, useRef, useEffect } from 'react'

function RconConsole({ apiUrl }) {
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const historyEndRef = useRef(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const executeCommand = async (e) => {
    e.preventDefault()
    if (!command.trim() || loading) return

    const cmd = command.trim()
    setCommand('')
    setLoading(true)

    // Add command to history
    setHistory(prev => [...prev, { type: 'command', text: cmd }])

    try {
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: cmd }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Command failed')
      }

      setHistory(prev => [...prev, { 
        type: 'response', 
        text: data.response || 'Command executed successfully' 
      }])
    } catch (error) {
      setHistory(prev => [...prev, { 
        type: 'error', 
        text: error.message 
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">RCON Console</h2>
        <button
          onClick={clearHistory}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto mb-4 font-mono text-sm border border-gray-700">
        {history.length === 0 ? (
          <div className="text-gray-500">No commands executed yet...</div>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              className={`mb-2 ${
                item.type === 'command' 
                  ? 'text-cs2-orange' 
                  : item.type === 'error'
                  ? 'text-red-400'
                  : 'text-gray-300'
              }`}
            >
              {item.type === 'command' && '> '}
              {item.text}
            </div>
          ))
        )}
        <div ref={historyEndRef} />
      </div>

      <form onSubmit={executeCommand} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter RCON command..."
          className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-orange"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="bg-cs2-orange hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : 'Execute'}
        </button>
      </form>
    </div>
  )
}

export default RconConsole

