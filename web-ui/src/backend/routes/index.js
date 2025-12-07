import express from 'express';
import RconClient from '../../shared/rcon.js';

const router = express.Router();

// Initialize RCON client
const rcon = new RconClient(
  process.env.RCON_HOST || 'cs2-server',
  parseInt(process.env.RCON_PORT || '27015'),
  process.env.RCON_PASSWORD || 'oscria'
);

// Ensure RCON connection with retry logic
const ensureConnection = async (req, res, next) => {
  try {
    if (!rcon.isConnected()) {
      // Try to connect with retries (will retry up to 5 times with 2s delay)
      await rcon.connect(5, 2000);
    }
    next();
  } catch (error) {
    console.error('RCON connection error:', error.message);
    res.status(503).json({ 
      error: 'Failed to connect to CS2 server', 
      details: error.message,
      hint: 'The CS2 server may still be starting up. Please wait a moment and try again.'
    });
  }
};

// Parse CS2 status response
function parseStatus(statusText) {
  const lines = statusText.split('\n');
  const result = {
    map: 'unknown',
    players: [],
    maxPlayers: 10,
    connected: true
  };

  // Parse map
  const mapLine = lines.find(line => line.toLowerCase().includes('map:') || line.toLowerCase().includes('hostname:'));
  if (mapLine) {
    const mapMatch = mapLine.match(/map:\s*([^\s]+)/i) || mapLine.match(/hostname:.*map\s+([^\s]+)/i);
    if (mapMatch) {
      result.map = mapMatch[1].trim();
    }
  }

  // Parse players - CS2 status format
  // Look for player list section (usually starts after "players:" or "userid")
  let inPlayerSection = false;
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect start of player list
    if (trimmed.includes('userid') || trimmed.includes('name') || trimmed.includes('players:')) {
      inPlayerSection = true;
      continue;
    }

    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) {
      continue;
    }

    // Parse player line (format varies, but typically: userid name uniqueid connected ping loss state)
    if (inPlayerSection && trimmed.match(/^\d+\s+\d+/)) {
      const parts = trimmed.split(/\s+/).filter(p => p);
      if (parts.length >= 2) {
        const userId = parts[0];
        const name = parts.slice(1).join(' ').replace(/"/g, '').trim();
        
        // Skip if it's just a number (likely userid)
        if (name && name !== userId && !name.match(/^\d+$/)) {
          result.players.push({
            userId: userId,
            name: name,
            connected: true
          });
        }
      }
    }
  }

  // Try alternative parsing with 'status' command response
  if (result.players.length === 0) {
    // Look for lines with player info in different formats
    for (const line of lines) {
      // Match patterns like: "# 123 "Player Name" STEAM_1:0:12345678"
      const playerMatch = line.match(/#\s*(\d+)\s+"([^"]+)"\s+(\S+)/);
      if (playerMatch) {
        result.players.push({
          userId: playerMatch[1],
          name: playerMatch[2],
          steamId: playerMatch[3],
          connected: true
        });
      }
    }
  }

  return result;
}

// Get server status
router.get('/status', ensureConnection, async (req, res) => {
  try {
    const statusText = await rcon.execute('status');
    const parsed = parseStatus(statusText);
    
    res.json({
      ...parsed,
      raw: statusText.substring(0, 500) // Limit raw output size
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get server status', details: error.message });
  }
});

// Execute RCON command
router.post('/execute', ensureConnection, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const response = await rcon.execute(command);
    res.json({ 
      success: true, 
      response: response,
      command: command
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute command', details: error.message });
  }
});

// Switch config
router.post('/config/switch', ensureConnection, async (req, res) => {
  try {
    const { config } = req.body;
    
    const validConfigs = ['warmup', 'competitive', 'competitive_workshop'];
    
    if (!validConfigs.includes(config)) {
      return res.status(400).json({ 
        error: 'Invalid config', 
        validConfigs: validConfigs 
      });
    }

    const command = `exec ${config}`;
    const response = await rcon.execute(command);
    
    res.json({ 
      success: true, 
      config: config,
      response: response
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to switch config', details: error.message });
  }
});

// Get players list
router.get('/players', ensureConnection, async (req, res) => {
  try {
    const statusText = await rcon.execute('status');
    const parsed = parseStatus(statusText);
    
    res.json({ players: parsed.players || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get players', details: error.message });
  }
});

// Kick player
router.post('/players/kick', ensureConnection, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const command = reason 
      ? `kickid ${userId} "${reason}"`
      : `kickid ${userId}`;
    
    const response = await rcon.execute(command);
    
    res.json({ 
      success: true, 
      userId: userId,
      response: response
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to kick player', details: error.message });
  }
});

// Change map
router.post('/maps/change', ensureConnection, async (req, res) => {
  try {
    const { map } = req.body;
    
    if (!map) {
      return res.status(400).json({ error: 'Map name is required' });
    }

    const response = await rcon.execute(`changelevel ${map}`);
    
    res.json({ 
      success: true, 
      map: map,
      response: response
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change map', details: error.message });
  }
});

export default router;

