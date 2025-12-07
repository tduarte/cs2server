# Deployment Guide for Dockge

This guide explains how to deploy the CS2 Server Management Stack using Dockge.

## Prerequisites

- Server with Docker and Dockge installed
- GitHub account (for pulling images from GitHub Container Registry)
- Steam Game Server Token (get from https://steamcommunity.com/dev/managegameservers)

## Quick Start (Dockge Only)

Since Dockge only requires a compose file, follow these steps:

### Step 1: Get the Compose File

Copy the contents of `compose.prod.yml` from the repository. You can view it here:
https://github.com/tduarte/cs2server/blob/main/compose.prod.yml

Or use this direct link to copy the raw content.

### Step 2: GitHub Container Registry Setup

**Important:** GitHub Container Registry packages are **private by default**, even if your repository is public.

**Option A: Make packages public** (Recommended for open-source - no login needed)
1. After pushing to GitHub, go to your repository
2. Click "Packages" in the right sidebar
3. For each package (`cs2server-web-ui-backend` and `cs2server-web-ui-frontend`):
   - Click the package name
   - Go to "Package settings"
   - Scroll to "Danger Zone"
   - Click "Change visibility" → "Change to public"
4. **No authentication needed** - anyone can pull the images

**Option B: Keep packages private** (Requires authentication)
- Create a GitHub Personal Access Token:
  1. Go to https://github.com/settings/tokens
  2. Click "Generate new token (classic)"
  3. Select `read:packages` permission
  4. Generate and copy the token

- Login via Docker (on your server):
  ```bash
  echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
  ```

- OR add registry in Dockge:
  - Go to Dockge Settings → Docker Registry
  - Add registry:
    - Registry URL: `ghcr.io`
    - Username: Your GitHub username
    - Password: Your GitHub Personal Access Token

### Step 3: Deploy in Dockge

1. **Open Dockge** in your browser (usually `http://your-server:5001`)

2. **Create a new stack**:
   - Click "Create Stack" or "+" button
   - Name it: `cs2server` (or your preferred name)

3. **Paste the compose file**:
   - Copy the entire contents of `compose.prod.yml` (see below)
   - Paste it into Dockge's compose editor

4. **Set environment variables**:
   - In Dockge, find the "Environment Variables" section (usually below the compose editor)
   - Add these **required** variables:
     ```
     SRCDS_TOKEN=your-steam-game-server-token-here
     CS2_RCONPW=your-secure-rcon-password-here
     ```
   - Add these **optional** variables (or use defaults):
     ```
     CS2_SERVERNAME=My CS2 Server
     CS2_MAXPLAYERS=10
     CS2_PORT=27015
     RCON_HOST=cs2-server
     RCON_PORT=27015
     ```

5. **Deploy**:
   - Click "Deploy" or "Start Stack"
   - Dockge will pull the images from GitHub Container Registry and start the containers
   - First startup may take 10+ minutes while CS2 server downloads game files

## Step 4: Verify Deployment

1. **Check container status** in Dockge - all containers should be running:
   - `cs2-server` (CS2 server)
   - `cs2-web-ui-backend` (Backend API)
   - `cs2-web-ui-frontend` (Web UI)

2. **Access the Web UI**:
   - Open `http://your-server:3000` in your browser
   - You should see the CS2 server management interface

3. **Check CS2 server logs**:
   - In Dockge, click on the `cs2-server` container
   - View logs to see server startup progress
   - First startup may take 10+ minutes while downloading game files

## Step 5: Configure Firewall

Make sure these ports are open in your firewall:

- **27015 TCP/UDP** - CS2 game server (required for players)
- **27020 UDP** - CS2 game server (required for players)
- **3000 TCP** - Web UI (optional, only if you want external access)
- **3001 TCP** - Backend API (optional, usually only needed internally)

Example UFW commands:
```bash
sudo ufw allow 27015/tcp
sudo ufw allow 27015/udp
sudo ufw allow 27020/udp
sudo ufw allow 3000/tcp  # Only if you want external web UI access
```

## Troubleshooting

### Images won't pull (401 Unauthorized)
- Make sure you're logged into GitHub Container Registry
- Verify your GitHub token has `read:packages` permission
- Check that the images exist: https://github.com/tduarte/cs2server/pkgs/container/cs2server-web-ui-backend

### CS2 server won't start
- Check logs: `docker logs cs2-server`
- Verify `SRCDS_TOKEN` is set correctly in `.env`
- Ensure the server has enough resources (CS2 server needs ~2GB RAM minimum)

### Web UI can't connect to CS2 server
- Verify `CS2_RCONPW` matches in both CS2 server and backend environment variables
- Check that `RCON_HOST` is set to `cs2-server` (the Docker service name)
- Ensure the backend container is on the same Docker network

### Port already in use
- Change ports in `compose.prod.yml` if needed:
  - CS2: Change `27015:27015` to `27016:27015` (external:internal)
  - Web UI: Change `3000:80` to `3001:80`

## Updating

To update to the latest version:

1. **Pull latest code** (if using git):
   ```bash
   cd cs2server
   git pull
   ```

2. **In Dockge**:
   - Go to your stack
   - Click "Update" or "Redeploy"
   - Dockge will pull the latest images and restart containers

## Environment Variables Reference

See `env.example` for all available configuration options.

**Required:**
- `SRCDS_TOKEN` - Steam Game Server Token
- `CS2_RCONPW` - RCON password

**Optional:**
- `CS2_SERVERNAME` - Server display name
- `CS2_PW` - Server password (empty for public)
- `CS2_MAXPLAYERS` - Max players (default: 10)
- `CS2_PORT` - Server port (default: 27015)
- `RCON_HOST` - RCON host (default: cs2-server)
- `RCON_PORT` - RCON port (default: 27015)

