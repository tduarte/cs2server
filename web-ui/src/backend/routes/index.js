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

  // Parse map - CS2 status format can vary
  // Look for lines like: "map     : de_dust2" or "map: de_dust2" or "hostname: Server Name\nmap: de_dust2"
  for (const line of lines) {
    const trimmed = line.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Try different patterns for map
    // Pattern 1: "map     : de_dust2" (with spaces before colon) - case insensitive
    let mapMatch = trimmed.match(/^map\s+:\s*([^\s\n\r]+)/i);
    if (mapMatch) {
      result.map = mapMatch[1].trim();
      break;
    }
    
    // Pattern 2: "map: de_dust2" (no spaces before colon)
    mapMatch = trimmed.match(/^map:\s*([^\s\n\r]+)/i);
    if (mapMatch) {
      result.map = mapMatch[1].trim();
      break;
    }
    
    // Pattern 3: "map de_dust2" (no colon, but has map keyword)
    if (lowerTrimmed.startsWith('map') && !lowerTrimmed.includes(':')) {
      mapMatch = trimmed.match(/^map\s+([^\s\n\r]+)/i);
      if (mapMatch) {
        result.map = mapMatch[1].trim();
        break;
      }
    }
  }
  
  // If still not found, search entire status text for map name patterns
  if (result.map === 'unknown') {
    // Look for common map name patterns: de_*, cs_*, workshop maps
    const mapPattern = /(?:map\s*[=:]\s*|level\s*[=:]\s*|current[_\s]map\s*[=:]\s*)?(de_\w+|cs_\w+|workshop\/\d+)/i;
    const mapMatch = statusText.match(mapPattern);
    if (mapMatch) {
      result.map = mapMatch[1];
    }
  }
  
  // If still not found, look for workshop map info in status
  if (result.map === 'unknown') {
    for (const line of lines) {
      // Look for workshop map: "host_workshop_map 3437809122"
      const workshopMatch = line.match(/host_workshop_map\s+(\d+)/i);
      if (workshopMatch) {
        result.map = `workshop/${workshopMatch[1]}`;
        break;
      }
    }
  }

  // Parse players - CS2 status format
  // CS2 status output format is typically:
  // # userid name uniqueid connected ping loss state
  // # 123 456 "Player Name" STEAM_1:0:12345678 01:23:45 45 0 active
  
  let inPlayerSection = false;
  let headerFound = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const lowerTrimmed = trimmed.toLowerCase();
    
    // Detect header line (contains userid, name, etc.)
    if (lowerTrimmed.includes('userid') && lowerTrimmed.includes('name')) {
      inPlayerSection = true;
      headerFound = true;
      continue;
    }
    
    // Also detect if we see "players:" or similar
    if (!headerFound && (lowerTrimmed.includes('players:') || lowerTrimmed.includes('connected players'))) {
      inPlayerSection = true;
      continue;
    }
    
    // Skip empty lines
    if (!trimmed) {
      continue;
    }
    
    // Parse player lines - CS2 format: # userid name uniqueid connected ping loss state
    // Example: # 123 456 "Player Name" STEAM_1:0:12345678 01:23:45 45 0 active
    if (inPlayerSection && trimmed.startsWith('#')) {
      // Remove the # prefix
      const content = trimmed.substring(1).trim();
      
      // Skip header lines
      if (content.toLowerCase().includes('userid') || content.toLowerCase().includes('name') && content.toLowerCase().includes('uniqueid')) {
        continue;
      }
      
      // Try to match CS2 player format: userid name "Player Name" STEAM_ID ...
      // Pattern 1: # 123 456 "Player Name" STEAM_1:0:12345678 ...
      let playerMatch = content.match(/^(\d+)\s+\d+\s+"([^"]+)"\s+(\S+)/);
      if (playerMatch) {
        result.players.push({
          userId: playerMatch[1],
          name: playerMatch[2],
          steamId: playerMatch[3],
          connected: true
        });
        continue;
      }
      
      // Pattern 2: # 123 456 PlayerName STEAM_1:0:12345678 ... (no quotes)
      playerMatch = content.match(/^(\d+)\s+\d+\s+(\S+)\s+(STEAM_\d+:\d+:\d+)/);
      if (playerMatch) {
        result.players.push({
          userId: playerMatch[1],
          name: playerMatch[2],
          steamId: playerMatch[3],
          connected: true
        });
        continue;
      }
      
      // Pattern 3: # userid "Player Name" STEAM_ID (simpler format)
      playerMatch = content.match(/^(\d+)\s+"([^"]+)"\s+(\S+)/);
      if (playerMatch) {
        result.players.push({
          userId: playerMatch[1],
          name: playerMatch[2],
          steamId: playerMatch[3],
          connected: true
        });
        continue;
      }
      
      // Pattern 4: Just userid and name: # 123 "Player Name"
      playerMatch = content.match(/^(\d+)\s+"([^"]+)"/);
      if (playerMatch) {
        result.players.push({
          userId: playerMatch[1],
          name: playerMatch[2],
          connected: true
        });
        continue;
      }
    }
    
    // Also try parsing lines without # prefix (some formats)
    if (inPlayerSection && !trimmed.startsWith('#') && trimmed.match(/^\d+\s+\d+\s+"/)) {
      const playerMatch = trimmed.match(/^(\d+)\s+\d+\s+"([^"]+)"\s+(\S+)/);
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
  
  // If still no players found, try a more aggressive search
  if (result.players.length === 0) {
    // Search entire status text for player patterns
    const playerPatterns = [
      /#\s*(\d+)\s+\d+\s+"([^"]+)"\s+(STEAM_\d+:\d+:\d+)/g,
      /#\s*(\d+)\s+"([^"]+)"\s+(STEAM_\d+:\d+:\d+)/g,
      /(\d+)\s+\d+\s+"([^"]+)"\s+(STEAM_\d+:\d+:\d+)/g
    ];
    
    for (const pattern of playerPatterns) {
      let match;
      while ((match = pattern.exec(statusText)) !== null) {
        result.players.push({
          userId: match[1],
          name: match[2],
          steamId: match[3],
          connected: true
        });
      }
      if (result.players.length > 0) break;
    }
  }
  
  // Log for debugging if no players found but we expect some
  if (result.players.length === 0 && statusText.toLowerCase().includes('player')) {
    console.log('Player parsing failed. Status output sample:', statusText.substring(0, 1000));
  }

  return result;
}

// Get server status
router.get('/status', ensureConnection, async (req, res) => {
  try {
    const statusText = await rcon.execute('status');
    const parsed = parseStatus(statusText);
    
    // If map is still unknown, try to get it directly
    if (parsed.map === 'unknown') {
      try {
        // Try different commands to get the current map
        const mapCommands = ['host_map', 'get5_status', 'mp_display_kill_assists'];
        for (const cmd of mapCommands) {
          try {
            const response = await rcon.execute(cmd);
            // Look for map name in response
            const mapMatch = response.match(/(?:map|current_map|levelname)\s*[=:]\s*([^\s\n]+)/i) ||
                           response.match(/de_\w+|cs_\w+|workshop\/\d+/i);
            if (mapMatch) {
              parsed.map = mapMatch[1] || mapMatch[0];
              break;
            }
          } catch (e) {
            // Command might not exist, try next one
            continue;
          }
        }
      } catch (e) {
        // Fallback failed, keep unknown
        console.log('Could not determine map via fallback commands');
      }
    }
    
    // Final fallback: try to get map using host_map cvar or other methods
    if (parsed.map === 'unknown') {
      try {
        // Try host_map cvar
        const hostMapResponse = await rcon.execute('host_map');
        if (hostMapResponse && hostMapResponse.trim() && !hostMapResponse.includes('Unknown command')) {
          parsed.map = hostMapResponse.trim();
        } else {
          // Try get5_status if available
          const get5Status = await rcon.execute('get5_status');
          const mapMatch = get5Status.match(/"map"\s*:\s*"([^"]+)"/i);
          if (mapMatch) {
            parsed.map = mapMatch[1];
          }
        }
      } catch (e) {
        // Ignore if commands fail
        console.log('Fallback map detection failed:', e.message);
      }
    }
    
    // Log for debugging if map is still unknown
    if (parsed.map === 'unknown') {
      console.log('Map parsing failed. Status output sample:', statusText.substring(0, 200));
    }
    
    res.json({
      ...parsed,
      raw: statusText.substring(0, 500) // Limit raw output size for debugging
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
    
    // If no players found via status, try alternative command
    if (parsed.players.length === 0) {
      try {
        // Try listplayers command (if available in CS2)
        const listPlayersResponse = await rcon.execute('listplayers');
        if (listPlayersResponse && !listPlayersResponse.includes('Unknown command')) {
          // Parse listplayers output (format may vary)
          const listLines = listPlayersResponse.split('\n');
          for (const line of listLines) {
            // Try to match player patterns in listplayers output
            const match = line.match(/(\d+)\s+"([^"]+)"\s+(STEAM_\d+:\d+:\d+)/) ||
                        line.match(/(\d+)\s+(\S+)\s+(STEAM_\d+:\d+:\d+)/);
            if (match) {
              parsed.players.push({
                userId: match[1],
                name: match[2],
                steamId: match[3],
                connected: true
              });
            }
          }
        }
      } catch (e) {
        // listplayers might not be available, that's okay
        console.log('listplayers command not available or failed');
      }
    }
    
    res.json({ 
      players: parsed.players || [],
      // Include raw status for debugging (first 500 chars)
      debug: process.env.NODE_ENV === 'development' ? statusText.substring(0, 500) : undefined
    });
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

// Get server password status
router.get('/server/password', ensureConnection, async (req, res) => {
  try {
    // Get current password setting
    // Note: sv_password without args returns current value, or "sv_password" = "" if no password
    const response = await rcon.execute('sv_password');
    
    // Parse response - CS2 returns something like:
    // "sv_password" = "" (if no password)
    // "sv_password" = "mypassword" (if password is set)
    const trimmed = response.trim();
    
    // Extract password value from response
    let password = null;
    let hasPassword = false;
    
    // Try to match patterns like: "sv_password" = "password" or "sv_password" = ""
    const match = trimmed.match(/"sv_password"\s*=\s*"([^"]*)"/i);
    if (match) {
      password = match[1];
      hasPassword = password.length > 0;
    } else {
      // Fallback: if response doesn't match expected format, check if it's empty
      // Sometimes CS2 just returns the password value directly
      if (trimmed && trimmed !== '""' && trimmed !== 'sv_password') {
        password = trimmed.replace(/^["']|["']$/g, ''); // Remove quotes if present
        hasPassword = password.length > 0;
      }
    }
    
    res.json({ 
      hasPassword: hasPassword,
      password: hasPassword ? password : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get server password status', details: error.message });
  }
});

// Set or remove server password
router.post('/server/password', ensureConnection, async (req, res) => {
  try {
    const { password } = req.body;
    
    // If password is empty string or null, remove password
    if (!password || password.trim() === '') {
      const response = await rcon.execute('sv_password ""');
      res.json({ 
        success: true, 
        message: 'Server password removed',
        hasPassword: false,
        response: response
      });
    } else {
      // Set new password
      const response = await rcon.execute(`sv_password "${password}"`);
      res.json({ 
        success: true, 
        message: 'Server password updated',
        hasPassword: true,
        response: response
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update server password', details: error.message });
  }
});

// Get server connection info
router.get('/server/connection', async (req, res) => {
  try {
    // Get server IP (default to localhost for same-machine connections)
    // In Docker, if web UI and CS2 are on same host, use localhost
    const serverIP = process.env.SERVER_IP || 'localhost';
    // Try to get port from various env vars, default to 27015
    const serverPort = process.env.CS2_PORT || process.env.RCON_PORT || '27015';
    
    // Get current password status
    let serverPassword = null;
    try {
      const passwordResponse = await rcon.execute('sv_password');
      const trimmed = passwordResponse.trim();
      const match = trimmed.match(/"sv_password"\s*=\s*"([^"]*)"/i);
      if (match && match[1].length > 0) {
        serverPassword = match[1];
      }
    } catch (e) {
      // Ignore password fetch errors
    }
    
    res.json({
      ip: serverIP,
      port: parseInt(serverPort),
      password: serverPassword,
      hasPassword: serverPassword !== null && serverPassword.length > 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get server connection info', details: error.message });
  }
});

export default router;

