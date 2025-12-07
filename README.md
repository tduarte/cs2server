# CS2 Server Management Stack

A complete Counter-Strike 2 dedicated server setup with a beautiful web management interface.

## Features

- **CS2 Dedicated Server**: Docker-based CS2 server using `joedwards32/cs2`
- **Web Management UI**: Modern React-based interface for server management
- **Configuration Files**: Pre-configured warmup, competitive, and workshop map configs
- **RCON Integration**: Full RCON support for server control

## Project Structure

```
cs2server/
├── compose.yml              # Docker Compose configuration
├── cfg/                     # CS2 server configuration files
│   ├── warmup.cfg
│   ├── gamemode_competitive_server.cfg
│   └── competitive_workshop.cfg
├── web-ui/                  # Web management interface
│   ├── backend/             # Node.js/Express API server
│   └── frontend/            # React frontend
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Running the Server (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/tduarte/cs2server.git
   cd cs2server
   ```

2. Create a `.env` file with your configuration:
   ```bash
   cp env.example .env
   # Edit .env and set SRCDS_TOKEN and CS2_RCONPW (required)
   ```

3. Start the stack:
   ```bash
   docker compose up -d
   ```

4. Access the web UI at `http://localhost:3000`

### Running the Server (Production)

1. Clone this repository:
   ```bash
   git clone https://github.com/tduarte/cs2server.git
   cd cs2server
   ```

2. Create a `.env` file with your configuration:
   ```bash
   cp env.example .env
   # Edit .env and set SRCDS_TOKEN and CS2_RCONPW (required)
   # NEVER commit .env to git - it contains sensitive credentials
   ```

3. Login to GitHub Container Registry (first time only):
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

4. Start the stack using the production compose file:
   ```bash
   docker compose -f compose.prod.yml up -d
   ```

5. Access the web UI at `http://localhost:3000`

**Note:** The production compose file uses pre-built images from GitHub Container Registry. Images are automatically built and pushed when you push to the `main` or `master` branch.

## Configuration

### Server Configuration

**Important:** All sensitive credentials are configured via environment variables in a `.env` file. Never commit `.env` to git!

Create a `.env` file from the example:
```bash
cp env.example .env
```

Required settings in `.env`:
- `SRCDS_TOKEN` - Steam Game Server Token (get from https://steamcommunity.com/dev/managegameservers)
- `CS2_RCONPW` - RCON password for server administration

Optional settings:
- `CS2_SERVERNAME` - Server display name
- `CS2_PW` - Server password (leave empty for public server)
- `CS2_MAXPLAYERS` - Maximum players (default: 10)
- `CS2_PORT` - Server port (default: 27015)
- `CS2_HOST_WORKSHOP_MAP` - Workshop map ID

See `env.example` for all available configuration options.

### Config Files

- **warmup.cfg**: Infinite money and ammo for practice
- **gamemode_competitive_server.cfg**: MR12 competitive with overtime
- **competitive_workshop.cfg**: Competitive mode with workshop map support

## Publishing Images to GitHub Container Registry

Images are automatically built and pushed to GitHub Container Registry (GHCR) when you:
- Push to `main` or `master` branch
- Create a tag (e.g., `v1.0.0`)
- Manually trigger the workflow

The images will be available at:
- `ghcr.io/tduarte/cs2server-web-ui-backend:latest`
- `ghcr.io/tduarte/cs2server-web-ui-frontend:latest`

### Manual Publishing

To manually build and push images:

1. Login to GHCR:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u tduarte --password-stdin
   ```

2. Build and push backend:
   ```bash
   docker build -t ghcr.io/tduarte/cs2server-web-ui-backend:latest ./web-ui/backend
   docker push ghcr.io/tduarte/cs2server-web-ui-backend:latest
   ```

3. Build and push frontend:
   ```bash
   docker build -t ghcr.io/tduarte/cs2server-web-ui-frontend:latest ./web-ui/frontend
   docker push ghcr.io/tduarte/cs2server-web-ui-frontend:latest
   ```

## Deployment

### Quick Start (Dockge)

**Just need to paste a compose file?** See [DOCKGE-QUICK-START.md](DOCKGE-QUICK-START.md) for copy-paste ready instructions.

### Detailed Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment instructions, including:
- Deploying with Dockge
- Setting up GitHub Container Registry authentication
- Production server configuration
- Troubleshooting guide

## Development

See `web-ui/README.md` for development setup instructions.

## Security

**Important Security Notes:**

1. **Never commit `.env` files** - They contain sensitive credentials (Steam tokens, RCON passwords)
2. **Use strong RCON passwords** - This password controls your server administration
3. **Keep your Steam Game Server Token private** - Anyone with this token can impersonate your server
4. **Review firewall settings** - Only expose necessary ports (27015 for CS2, 3000/3001 for web UI if needed)

The repository is designed to be open-source safe - all sensitive values are configured via environment variables that are never committed to the repository.

## License

MIT

