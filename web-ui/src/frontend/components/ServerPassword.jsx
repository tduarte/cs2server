import { useState, useEffect } from 'react'

function ServerPassword({ apiUrl }) {
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState(null)
  const [hasPassword, setHasPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchPasswordStatus()
  }, [])

  const fetchPasswordStatus = async () => {
    setFetching(true)
    try {
      const response = await fetch(`${apiUrl}/api/server/password`)
      if (!response.ok) throw new Error('Failed to fetch password status')
      const data = await response.json()
      setHasPassword(data.hasPassword)
      setCurrentPassword(data.password)
    } catch (error) {
      console.error('Error fetching password status:', error)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch(`${apiUrl}/api/server/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update server password')
      }

      setMessage({ 
        type: 'success', 
        text: data.message || (password.trim() ? 'Server password set' : 'Server password removed')
      })
      
      // Update local state
      setHasPassword(data.hasPassword)
      setCurrentPassword(data.hasPassword ? password.trim() : null)
      setPassword('')
      
      // Refresh status
      await fetchPasswordStatus()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the server password? Players will be able to join without a password.')) {
      return
    }

    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch(`${apiUrl}/api/server/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove server password')
      }

      setMessage({ type: 'success', text: 'Server password removed' })
      setHasPassword(false)
      setCurrentPassword(null)
      setPassword('')
      
      await fetchPasswordStatus()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Server Password</h2>
      <p className="text-gray-400 text-sm mb-4">
        Set or remove the server password. Players need this password to join your server.
      </p>

      {fetching ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cs2-orange"></div>
        </div>
      ) : (
        <>
          {hasPassword && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <div className="text-sm text-yellow-200 mb-1">Current Password:</div>
              <div className="text-lg font-mono text-yellow-100">
                {currentPassword ? '•'.repeat(currentPassword.length) : 'Set'}
              </div>
            </div>
          )}

          {!hasPassword && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <div className="text-sm text-green-200">Server is currently public (no password required)</div>
            </div>
          )}

          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-900/50 border border-green-500 text-green-100' 
                : 'bg-red-900/50 border border-red-500 text-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                {hasPassword ? 'Change Password' : 'Set Password'}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={hasPassword ? 'Enter new password' : 'Enter server password'}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cs2-orange"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Leave empty to remove password (make server public)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cs2-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : (hasPassword ? 'Change Password' : 'Set Password')}
              </button>

              {hasPassword && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={loading}
                  className="bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default ServerPassword

