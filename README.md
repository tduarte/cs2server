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

### Running the Server

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd cs2server
   ```

2. Update `compose.yml` with your server token and configuration

3. Start the stack:
   ```bash
   docker compose up -d
   ```

4. Access the web UI at `http://localhost:3000`

## Configuration

### Server Configuration

Edit `compose.yml` to configure:
- Server token (`SRCDS_TOKEN`)
- RCON password (`CS2_RCONPW`)
- Server password (`CS2_PW`)
- Max players (`CS2_MAXPLAYERS`)
- Workshop map (`CS2_HOST_WORKSHOP_MAP`)

### Config Files

- **warmup.cfg**: Infinite money and ammo for practice
- **gamemode_competitive_server.cfg**: MR12 competitive with overtime
- **competitive_workshop.cfg**: Competitive mode with workshop map support

## Development

See `web-ui/README.md` for development setup instructions.

## License

MIT

