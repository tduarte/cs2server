# CS2 Server Management Stack

A modern, Docker-based Counter-Strike 2 server with a beautiful web management interface.

## Features

- **CS2 Dedicated Server**: Automated setup using `joedwards32/cs2`
- **Web Management UI**: React/Node.js interface to manage your server
- **RCON Control**: Execute commands, kick players, change maps via web UI
- **Config Management**: Switch between Competitive, Warmup, and Workshop modes
- **Password Management**: Set/remove server password instantly
- **One-Click Connect**: Connect to your server directly from the UI

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose
- [Steam Game Server Token](https://steamcommunity.com/dev/managegameservers) (App ID: 730)

### 2. Setup
```bash
# Clone repository
git clone https://github.com/tduarte/cs2server.git
cd cs2server

# Create configuration
cp env.example .env
```

### 3. Configure
Edit `.env` and set your credentials:
```ini
SRCDS_TOKEN=your_steam_token_here
CS2_RCONPW=your_secure_password
CS2_SERVERNAME=My CS2 Server
```

### 4. Run
```bash
docker compose up -d
```

> **Note:** First startup takes 10-15 minutes to download the 30GB+ game files. Watch progress with `docker compose logs -f cs2-server`.

## Usage

Access the web interface at **http://localhost:3000**

### Key Features
- **Dashboard**: Real-time server status and player count
- **Configs**: Switch between pre-configured modes (Competitive MR12, Warmup)
- **Maps**: Change maps or load workshop maps
- **Players**: View connected players and kick them
- **Console**: Direct RCON console access

## Customization

### Configuration Files
Located in `cfg/`:
- `warmup.cfg`: Infinite money/ammo settings
- `gamemode_competitive_server.cfg`: Official competitive settings
- `competitive_workshop.cfg`: Competitive settings for workshop maps

### Development
To modify the web UI:

```bash
cd web-ui
# Start dev server with hot-reload (connects to running CS2 server)
docker compose -f docker-compose.dev.yml up
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **503 Error in Web UI** | Server is still starting or RCON password mismatch. Check `.env` and logs. |
| **Server Not Starting** | Verify `SRCDS_TOKEN` is valid. Ensure port 27015 is free. |
| **Players Can't Join** | Check firewall (Ports 27015 TCP/UDP, 27020 UDP). |

## License
MIT
