# Quick Start for Dockge

## Copy-Paste Ready Instructions

### 1. GitHub Container Registry Setup

**Option A: If packages are PUBLIC** (no login needed)
- Skip this step! Images can be pulled without authentication.

**Option B: If packages are PRIVATE** (default - login required)
- On your server, run:
  ```bash
  echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
  ```
- Get a token from: https://github.com/settings/tokens (needs `read:packages` permission)
- OR add registry in Dockge Settings → Docker Registry

**To make packages public** (after pushing):
1. Go to your repo → Packages
2. Click each package → Package settings → Change visibility → Public

### 2. In Dockge UI

1. Click **"Create Stack"**
2. Name: `cs2server`
3. Paste the compose file below into the editor
4. Add these environment variables:

```
SRCDS_TOKEN=your-steam-token-here
CS2_RCONPW=your-rcon-password-here
CS2_SERVERNAME=My CS2 Server
CS2_MAXPLAYERS=10
```

5. Click **"Deploy"**

---

## Compose File (Copy Everything Below)

```yaml
services:
  cs2-server:
    image: joedwards32/cs2
    platform: linux/amd64
    container_name: cs2-server
    environment:
      # Server configuration - REQUIRED: Set these in .env file
      - SRCDS_TOKEN=${SRCDS_TOKEN} # REQUIRED: Game Server Token from https://steamcommunity.com/dev/managegameservers
      - DEBUG=${DEBUG:-0} # (0 - off, 1 - steamcmd, 2 - cs2, 3 - all)
      - STEAMAPPVALIDATE=${STEAMAPPVALIDATE:-0} # (0 - no validation, 1 - enable validation)
      - CS2_SERVERNAME=${CS2_SERVERNAME:-CS2 Server} # (Set the visible name for your private server.)
      - CS2_CHEATS=${CS2_CHEATS:-0} # (0 - disable cheats, 1 - enable cheats)
      - CS2_LAN=${CS2_LAN:-0}
      - CS2_PORT=${CS2_PORT:-27015} # (CS2 server listen port tcp_udp)
      - CS2_SERVER_HIBERNATE=${CS2_SERVER_HIBERNATE:-0} # (Put server in a low CPU state when there are no players. 0 - hibernation disabled, 1 - hibernation enabled)
      - CS2_RCONPW=${CS2_RCONPW} # REQUIRED: RCON password
      - CS2_PW=${CS2_PW:-} # (Optional, CS2 server password)
      - CS2_MAXPLAYERS=${CS2_MAXPLAYERS:-10} # (Max players)
      - CS2_ADDITIONAL_ARGS=+exec competitive_workshop # (Optional additional arguments to pass into cs2 - using workshop competitive config)
      - CS2_CFG_URL= # HTTP/HTTPS URL to fetch a Tar Gzip bundle, Tar or Zip archive of configuration files/mods (fill in when you have the URL)
      # Game modes
      - CS2_GAMEALIAS=competitive # (Game type, e.g. casual, competitive, deathmatch. See https://developer.valvesoftware.com/wiki/Counter-Strike_2/Dedicated_Servers)
      - CS2_MAPGROUP=mg_active # (Map pool. Ignored if Workshop maps are defined.)
      # CS2_STARTMAP=de_inferno # (Start map. Ignored if Workshop maps are defined - commented out since workshop map is used)
      # Workshop Maps
      - CS2_HOST_WORKSHOP_COLLECTION # The workshop collection to use
      - CS2_HOST_WORKSHOP_MAP=3437809122 # The workshop map to use. If collection is also defined, this is the starting map.
    volumes:
      - cs2:/home/steam/cs2-dedicated/ # Persistent data volume mount point inside container
    ports:
      - 27015:27015/tcp # TCP
      - 27015:27015/udp # UDP
      - 27020:27020/udp # UDP
    stdin_open: true # Add local console for docker attach, docker attach --sig-proxy=false cs2-server
    tty: true # Add local console for docker attach, docker attach --sig-proxy=false cs2-server
    healthcheck:
      # Wait for CS2 server to be ready - the start_period gives it time to download
      # After start_period, check if port is open (basic check)
      # Backend retry logic will handle actual RCON authentication
      test: ["CMD-SHELL", "timeout 2 bash -c '</dev/tcp/127.0.0.1/27015' 2>/dev/null && exit 0 || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 600s # Give CS2 server 10 minutes to download and start (first time can take a while)
    networks:
      - cs2-network

  # Web UI Backend
  web-ui-backend:
    image: ghcr.io/tduarte/cs2server-web-ui-backend:latest
    container_name: cs2-web-ui-backend
    environment:
      - RCON_HOST=${RCON_HOST:-cs2-server}
      - RCON_PORT=${RCON_PORT:-27015}
      - RCON_PASSWORD=${CS2_RCONPW} # Uses same password as CS2 server
      - PORT=3001
    ports:
      - 3001:3001
    depends_on:
      cs2-server:
        condition: service_healthy
    networks:
      - cs2-network
    restart: unless-stopped

  # Web UI Frontend
  web-ui-frontend:
    image: ghcr.io/tduarte/cs2server-web-ui-frontend:latest
    container_name: cs2-web-ui-frontend
    ports:
      - 3000:80
    depends_on:
      - web-ui-backend
    networks:
      - cs2-network
    restart: unless-stopped

volumes:
  cs2: null

networks:
  cs2-network:
    driver: bridge
```

---

## Required Environment Variables

Set these in Dockge's environment variables section:

| Variable | Description | Required |
|----------|-------------|----------|
| `SRCDS_TOKEN` | Steam Game Server Token from https://steamcommunity.com/dev/managegameservers | ✅ Yes |
| `CS2_RCONPW` | RCON password for server administration | ✅ Yes |
| `CS2_SERVERNAME` | Server display name | No (default: "CS2 Server") |
| `CS2_MAXPLAYERS` | Maximum players | No (default: 10) |
| `CS2_PW` | Server password (leave empty for public) | No |

---

## After Deployment

1. **Wait 10-15 minutes** for CS2 server to download game files (first time only)
2. **Access Web UI** at `http://your-server:3000`
3. **Check logs** in Dockge to monitor startup progress
4. **Open firewall ports**: 27015 (TCP/UDP), 27020 (UDP) for players

---

## Troubleshooting

**Images won't pull?**
- If packages are private: Make sure you're logged into `ghcr.io` (see step 1)
- If packages are public: No login needed, but verify images exist: https://github.com/tduarte/cs2server/pkgs
- Check that GitHub Actions workflow completed successfully (images must be built first)

**CS2 server won't start?**
- Check `SRCDS_TOKEN` is correct
- View logs: Click on `cs2-server` container in Dockge

**Web UI can't connect?**
- Verify `CS2_RCONPW` matches in both CS2 server and backend env vars
- Wait for CS2 server to fully start (check health status)

