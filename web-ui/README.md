# CS2 Server Web Management UI

A modern web interface for managing your CS2 dedicated server.

## Development Setup (Docker Only)

This project uses Docker for all development work. You don't need Node.js or npm installed locally.

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

1. **Edit code**: Make changes to files in `backend/src/` or `frontend/src/`
2. **Auto-reload**: Changes are automatically detected and the dev servers reload
3. **View logs**: Watch container logs with `docker compose -f docker-compose.dev.yml logs -f`

### Stopping Development Environment

```bash
docker compose -f docker-compose.dev.yml down
```

### Rebuilding Containers

If you change `package.json` files or Dockerfiles, rebuild:

```bash
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up
```

### Connecting to CS2 Server

The development setup needs to connect to your CS2 server. Configure this based on where your CS2 server is running:

#### Option 1: CS2 Server Running on Host Machine (Default)

Default configuration uses `host.docker.internal` to connect to CS2 server on your host:
```bash
docker compose -f docker-compose.dev.yml up
```

#### Option 2: CS2 Server Running in Docker (Same Stack)

If CS2 server is running via the main `compose.yml`:

1. Start CS2 server first:
   ```bash
   cd ..  # Go to project root
   docker compose up -d cs2-server
   ```

2. Update `docker-compose.dev.yml`:
   - Set `RCON_HOST=cs2-server` in backend environment
   - Uncomment the `cs2-network` network sections
   - Update network name if your project name differs

3. Start dev environment:
   ```bash
   cd web-ui
   docker compose -f docker-compose.dev.yml up
   ```

#### Option 3: CS2 Server Running in Docker (Different Stack)

Set environment variables when starting:
```bash
RCON_HOST=cs2-server docker compose -f docker-compose.dev.yml up
```

Or edit `docker-compose.dev.yml` to change the default `RCON_HOST` value.

## Building for Production

Production builds are handled automatically by the main `compose.yml`:

```bash
# From project root
docker compose build
docker compose up -d
```

## Production Deployment

The web UI is integrated into the main `compose.yml` file. To deploy:

```bash
# From project root
docker compose up -d
```

The web UI will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Features

- **Server Status Dashboard**: Real-time server status display
- **Config Switcher**: One-click switching between warmup, competitive, and workshop configs
- **RCON Console**: Execute any CS2 server command
- **Player Management**: View and manage connected players
- **Map Selector**: Change maps with a simple interface

## API Endpoints

- `GET /api/status` - Get server status
- `POST /api/execute` - Execute RCON command
- `POST /api/config/switch` - Switch server config
- `GET /api/players` - Get players list
- `POST /api/players/kick` - Kick a player
- `POST /api/maps/change` - Change map

