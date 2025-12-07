# CS2 Server Management Stack

A complete Counter-Strike 2 dedicated server setup with a beautiful web management interface.

## Features

- **CS2 Dedicated Server**: Docker-based CS2 server using `joedwards32/cs2`
- **Web Management UI**: Modern React-based interface for server management (frontend + backend in single package)
- **Custom RCON Implementation**: Built-in RCON client based on Valve's Source RCON protocol
- **Configuration Files**: Pre-configured warmup, competitive, and workshop map configs
- **RCON Integration**: Full RCON support for server control

## Project Structure

```
cs2server/
├── compose.yml              # Docker Compose configuration (development)
├── compose.prod.yml         # Production compose with pre-built images
├── cfg/                     # CS2 server configuration files
│   ├── warmup.cfg
│   ├── gamemode_competitive_server.cfg
│   └── competitive_workshop.cfg
├── web-ui/                  # Web management interface (monorepo)
│   ├── src/
│   │   ├── backend/         # Express API server
│   │   ├── frontend/         # React frontend
│   │   └── shared/           # Shared code (RCON client)
│   ├── Dockerfile           # Production Dockerfile
│   └── package.json         # Unified package.json
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Steam Game Server Token (get from https://steamcommunity.com/dev/managegameservers)

### Running the Server

1. **Clone this repository:**
   ```bash
   git clone https://github.com/tduarte/cs2server.git
   cd cs2server
   ```

2. **Create a `.env` file with your configuration:**
   ```bash
   cp env.example .env
   # Edit .env and set SRCDS_TOKEN and CS2_RCONPW (required)
   ```

3. **Start the stack:**
   ```bash
   docker compose up -d
   ```

4. **Access the web UI at `http://localhost:3000`**

**Note:** First startup takes 10-15 minutes while CS2 server downloads game files.

## Configuration

### Environment Variables

**Important:** All sensitive credentials are configured via environment variables in a `.env` file. Never commit `.env` to git!

**Required:**
- `SRCDS_TOKEN` - Steam Game Server Token (get from https://steamcommunity.com/dev/managegameservers)
- `CS2_RCONPW` - RCON password for server administration

**Optional:**
- `CS2_SERVERNAME` - Server display name (default: "CS2 Server")
- `CS2_PW` - Server password (leave empty for public server)
- `CS2_MAXPLAYERS` - Maximum players (default: 10)
- `CS2_PORT` - Server port (default: 27015)
- `RCON_HOST` - RCON host (default: cs2-server)
- `RCON_PORT` - RCON port (default: 27015)

See `env.example` for all available configuration options.

### Config Files

- **warmup.cfg**: Infinite money and ammo for practice
- **gamemode_competitive_server.cfg**: MR12 competitive with overtime
- **competitive_workshop.cfg**: Competitive mode with workshop map support

## Deployment with Dockge

### Quick Start

1. **Login to GitHub Container Registry** (if packages are private):
   ```bash
   echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```
   Get a token from: https://github.com/settings/tokens (needs `read:packages` permission)

2. **In Dockge UI:**
   - Click "Create Stack"
   - Name: `cs2server`
   - Paste the contents of `compose.prod.yml` into the compose editor
   - Add environment variables:
     ```
     SRCDS_TOKEN=your-steam-token-here
     CS2_RCONPW=your-rcon-password-here
     CS2_SERVERNAME=My CS2 Server
     CS2_MAXPLAYERS=10
     ```
   - Click "Deploy"

### Making Packages Public (Optional)

GitHub Container Registry packages are private by default. To make them public (no login needed):

1. Go to your repository → Packages
2. Click each package → Package settings → Change visibility → Public

## Publishing Images to GitHub Container Registry

Images are automatically built and pushed to GitHub Container Registry (GHCR) when you:
- Push to `main` or `master` branch
- Create a tag (e.g., `v1.0.0`)
- Manually trigger the workflow

The image will be available at:
- `ghcr.io/tduarte/cs2server-web-ui:latest`

## Development

### Prerequisites

- Docker and Docker Compose
- CS2 server running (either in Docker or on host machine)

### Starting Development Environment

1. Navigate to the web-ui directory:
   ```bash
   cd web-ui
   ```

2. Start the development containers:
   ```bash
   docker compose -f docker-compose.dev.yml up
   ```

   This will:
   - Build the backend and frontend containers with all dependencies
   - Start both services in development mode with hot reload
   - Mount your source code for live editing

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Development Workflow

1. **Edit code**: Make changes to files in `src/backend/` or `src/frontend/`
2. **Auto-reload**: Changes are automatically detected and the dev servers reload
3. **View logs**: Watch container logs with `docker compose -f docker-compose.dev.yml logs -f`

### Connecting to CS2 Server

The development setup needs to connect to your CS2 server. Configure this based on where your CS2 server is running:

- **CS2 Server on Host**: Use `RCON_HOST=host.docker.internal` (default)
- **CS2 Server in Docker**: Set `RCON_HOST=cs2-server` and connect to the same network

## API Endpoints

- `GET /api/status` - Get server status
- `POST /api/execute` - Execute RCON command
- `POST /api/config/switch` - Switch server config
- `GET /api/players` - Get players list
- `POST /api/players/kick` - Kick a player
- `POST /api/maps/change` - Change map

## Troubleshooting

### 503 Service Unavailable Error

If you see a 503 error when accessing the web UI, it means the backend cannot connect to the CS2 server via RCON.

**Quick Checks:**
1. Check if CS2 server container is running: `docker ps | grep cs2-server`
2. Check CS2 server logs: `docker logs cs2-server`
3. Check backend logs: `docker logs cs2-web-ui`
4. Verify environment variables are set (especially `SRCDS_TOKEN` and `CS2_RCONPW`)

### Common Issues

#### CS2 Server Still Starting Up
- First startup takes 10-15 minutes while downloading game files
- Wait for CS2 server to finish downloading
- Check logs: `docker logs cs2-server`
- Look for "Server is ready" or similar message

#### RCON Password Mismatch
- Verify `CS2_RCONPW` is set correctly in your environment variables
- The compose file automatically passes `CS2_RCONPW` to the web-ui service as `RCON_PASSWORD`
- **Don't set `RCON_PASSWORD` separately** - it's automatically set from `CS2_RCONPW`
- Verify both containers have the same password:
  ```bash
  docker exec cs2-server env | grep CS2_RCONPW
  docker exec cs2-web-ui env | grep RCON_PASSWORD
  ```

#### CS2 Server Container Not Running
- Check logs: `docker logs cs2-server`
- Common causes:
  - Missing `SRCDS_TOKEN` (required)
  - Invalid Steam token
  - Port conflict (port 27015 already in use)
  - Insufficient resources (CS2 server needs ~2GB RAM minimum)

#### Network Connectivity Issue
- Verify containers are on the same network: `docker network inspect cs2server_cs2-network`
- Check that `RCON_HOST` is set to `cs2-server` (the service name)
- Test connectivity: `docker exec cs2-web-ui ping cs2-server`

### Debugging Steps

1. **Check CS2 server status:**
   ```bash
   docker logs cs2-server --tail 50
   ```

2. **Check backend connection attempts:**
   ```bash
   docker logs cs2-web-ui --tail 50
   ```

3. **Verify environment variables:**
   - In Dockge, check Environment Variables section
   - Ensure `SRCDS_TOKEN` and `CS2_RCONPW` are set
   - Ensure `RCON_HOST=cs2-server`

4. **Check container health:**
   ```bash
   docker ps
   ```
   Look for health status - CS2 server should show "healthy" when ready

### Still Not Working?

1. **Restart the stack:**
   - In Dockge, stop the stack
   - Wait 10 seconds
   - Start it again

2. **Check firewall:**
   - Ensure ports 27015 (TCP/UDP) and 27020 (UDP) are open for CS2
   - Port 3000 (TCP) for web UI if you want external access

3. **Verify images are up to date:**
   ```bash
   docker pull ghcr.io/tduarte/cs2server-web-ui:latest
   ```

## Security

**Important Security Notes:**

1. **Never commit `.env` files** - They contain sensitive credentials (Steam tokens, RCON passwords)
2. **Use strong RCON passwords** - This password controls your server administration
3. **Keep your Steam Game Server Token private** - Anyone with this token can impersonate your server
4. **Review firewall settings** - Only expose necessary ports (27015 for CS2, 3000 for web UI if needed)

The repository is designed to be open-source safe - all sensitive values are configured via environment variables that are never committed to the repository.

## Firewall Configuration

Make sure these ports are open in your firewall:

- **27015 TCP/UDP** - CS2 game server (required for players)
- **27020 UDP** - CS2 game server (required for players)
- **3000 TCP** - Web UI (optional, only if you want external access)

Example UFW commands:
```bash
sudo ufw allow 27015/tcp
sudo ufw allow 27015/udp
sudo ufw allow 27020/udp
sudo ufw allow 3000/tcp  # Only if you want external web UI access
```

## Updating

To update to the latest version:

1. **Pull latest code** (if using git):
   ```bash
   git pull
   ```

2. **In Dockge**:
   - Go to your stack
   - Click "Update" or "Redeploy"
   - Dockge will pull the latest images and restart containers

## License

MIT
