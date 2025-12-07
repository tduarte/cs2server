import { useState, useEffect } from 'react'

function Dashboard({ status }) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Server Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Status</div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-lg font-semibold text-white">Online</span>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Current Map</div>
          <div className="text-lg font-semibold text-white">
            {status.map || 'Unknown'}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-1">Players</div>
          <div className="text-lg font-semibold text-white">
            {status.players?.length || 0} / 10
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

