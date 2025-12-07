# Troubleshooting Guide

## 503 Service Unavailable Error

If you see a 503 error when accessing the web UI, it means the backend cannot connect to the CS2 server via RCON.

### Quick Checks

1. **Check if CS2 server container is running:**
   ```bash
   docker ps | grep cs2-server
   ```
   If it's not running, check logs:
   ```bash
   docker logs cs2-server
   ```

2. **Check backend logs:**
   ```bash
   docker logs cs2-web-ui-backend
   ```
   Look for RCON connection errors.

3. **Verify environment variables are set:**
   - `SRCDS_TOKEN` - Must be set (no default)
   - `CS2_RCONPW` - Must be set (no default)
   - `RCON_HOST` - Should be `cs2-server` (default)
   - `RCON_PORT` - Should be `27015` (default)

### Common Issues

#### Issue 1: CS2 Server Still Starting Up

**Symptoms:**
- CS2 server container is running but logs show "downloading" or "updating"
- First startup takes 10-15 minutes

**Solution:**
- Wait for CS2 server to finish downloading game files
- Check logs: `docker logs cs2-server`
- Look for "Server is ready" or similar message
- The healthcheck allows 10 minutes (600s) for startup

#### Issue 2: RCON Password Mismatch

**Symptoms:**
- Backend logs show "Authentication failed" or "Connection refused"
- CS2 server is running but backend can't connect

**Solution:**
1. Verify `CS2_RCONPW` is set correctly in your environment variables
2. Verify `RCON_PASSWORD` in backend matches `CS2_RCONPW` (they should be the same)
3. In Dockge, check that both services have the same `CS2_RCONPW` value

#### Issue 3: CS2 Server Container Not Running

**Symptoms:**
- Container shows as "Exited" or "Stopped"
- No logs or error logs

**Solution:**
1. Check CS2 server logs: `docker logs cs2-server`
2. Common causes:
   - Missing `SRCDS_TOKEN` (required)
   - Invalid Steam token
   - Port conflict (port 27015 already in use)
   - Insufficient resources

#### Issue 4: Network Connectivity Issue

**Symptoms:**
- Containers are running but can't communicate
- Backend logs show "ECONNREFUSED" or "ENOTFOUND"

**Solution:**
1. Verify containers are on the same network:
   ```bash
   docker network inspect cs2server_cs2-network
   ```
2. Check that `RCON_HOST` is set to `cs2-server` (the service name, not container name)
3. Try connecting from backend container:
   ```bash
   docker exec cs2-web-ui-backend ping cs2-server
   ```

### Debugging Steps

1. **Check CS2 server status:**
   ```bash
   docker logs cs2-server --tail 50
   ```

2. **Check backend connection attempts:**
   ```bash
   docker logs cs2-web-ui-backend --tail 50
   ```

3. **Test RCON connection manually:**
   ```bash
   # Install rcon client (if not available)
   # Then test connection:
   rcon -a cs2-server:27015 -p YOUR_RCON_PASSWORD status
   ```

4. **Verify environment variables in Dockge:**
   - Go to your stack in Dockge
   - Check Environment Variables section
   - Ensure `SRCDS_TOKEN` and `CS2_RCONPW` are set
   - Ensure `RCON_HOST=cs2-server` (or matches your service name)

5. **Check container health:**
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
   - Ensure ports 27015 (TCP/UDP) and 27020 (UDP) are open
   - Internal Docker networking should work regardless

3. **Verify images are up to date:**
   ```bash
   docker pull ghcr.io/tduarte/cs2server-web-ui-backend:latest
   docker pull ghcr.io/tduarte/cs2server-web-ui-frontend:latest
   ```

4. **Check Docker resources:**
   - CS2 server needs at least 2GB RAM
   - Ensure Docker has enough resources allocated

