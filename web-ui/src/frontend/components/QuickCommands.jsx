import { useState } from 'react'

function QuickCommands({ apiUrl }) {
  const [executing, setExecuting] = useState(null)
  const [feedback, setFeedback] = useState({})

  const commands = [
    { label: 'Restart Game', cmd: 'mp_restartgame 1', icon: '🔄' },
    { label: 'End Warmup', cmd: 'mp_warmup_end', icon: '⏱️' },
    { label: 'Pause Match', cmd: 'mp_pause_match', icon: '⏸️' },
    { label: 'Unpause Match', cmd: 'mp_unpause_match', icon: '▶️' },
    { label: 'Kick All Bots', cmd: 'bot_kick', icon: '🤖' },
    { label: 'Add Bot (CT)', cmd: 'bot_add_ct', icon: '👮' },
    { label: 'Add Bot (T)', cmd: 'bot_add_t', icon: '🥷' },
    { label: 'Max Money', cmd: 'mp_maxmoney 60000; mp_startmoney 60000; mp_afterroundmoney 60000', icon: '💰' },
    { label: 'Infinite Ammo On', cmd: 'sv_infinite_ammo 1', icon: '♾️' },
    { label: 'Infinite Ammo Off', cmd: 'sv_infinite_ammo 0', icon: '🔫' },
  ]

  const executeCommand = async (cmd, index) => {
    setExecuting(index)
    setFeedback(prev => ({ ...prev, [index]: null }))

    try {
      const response = await fetch(`${apiUrl}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })

      if (!response.ok) throw new Error('Failed')
      
      setFeedback(prev => ({ ...prev, [index]: 'success' }))
    } catch (error) {
      setFeedback(prev => ({ ...prev, [index]: 'error' }))
    } finally {
      setExecuting(null)
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, [index]: null }))
      }, 2000)
    }
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-cs2-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Commands
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        {commands.map((item, index) => (
          <button
            key={index}
            onClick={() => executeCommand(item.cmd, index)}
            disabled={executing === index}
            className={`
              relative group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${feedback[index] === 'success' 
                ? 'bg-green-900/40 text-green-200 border border-green-500/30' 
                : feedback[index] === 'error'
                ? 'bg-red-900/40 text-red-200 border border-red-500/30'
                : 'bg-gray-900/50 text-gray-300 border border-gray-700/50 hover:bg-gray-800 hover:text-white hover:border-cs2-orange/50'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>

            {executing === index ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : feedback[index] === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : feedback[index] === 'error' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default QuickCommands

