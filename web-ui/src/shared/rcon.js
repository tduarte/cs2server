import net from 'net';

// RCON Packet Types (Source RCON Protocol)
const PACKET_TYPES = {
  SERVERDATA_AUTH: 3,
  SERVERDATA_AUTH_RESPONSE: 2,
  SERVERDATA_EXECCOMMAND: 2,
  SERVERDATA_RESPONSE_VALUE: 0,
};

class RconClient {
  constructor(host, port, password) {
    this.host = host;
    this.port = port;
    this.password = password;
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.responseQueue = [];
    this.currentResolve = null;
  }

  /**
   * Build RCON packet according to Source RCON protocol
   * Packet structure: ID (4 bytes), Type (4 bytes), Body (variable), Padding (1 byte null)
   */
  buildPacket(id, type, body) {
    const bodyBuffer = Buffer.from(body, 'utf8');
    const packetSize = 4 + 4 + bodyBuffer.length + 1; // ID + Type + Body + Padding
    
    const packet = Buffer.allocUnsafe(4 + packetSize); // Size + Packet
    packet.writeInt32LE(packetSize, 0); // Packet size (excluding this field)
    packet.writeInt32LE(id, 4); // Request ID
    packet.writeInt32LE(type, 8); // Packet type
    bodyBuffer.copy(packet, 12); // Body
    packet[12 + bodyBuffer.length] = 0; // Null terminator
    
    return packet;
  }

  /**
   * Parse RCON packet response
   */
  parsePacket(buffer) {
    if (buffer.length < 12) {
      return null; // Not enough data
    }

    const size = buffer.readInt32LE(0);
    if (buffer.length < 4 + size) {
      return null; // Packet not complete
    }

    const id = buffer.readInt32LE(4);
    const type = buffer.readInt32LE(8);
    const body = buffer.slice(12, 12 + size - 9).toString('utf8'); // Exclude ID, Type, and padding

    return { id, type, body, size: 4 + size };
  }

  async connect(retries = 5, delay = 2000) {
    if (this.connected && this.authenticated && this.socket) {
      return true;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Clean up previous connection
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.destroy();
          this.socket = null;
        }

        this.connected = false;
        this.authenticated = false;
        this.pendingRequests.clear();
        this.requestId = 0;

        // Create TCP connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (this.socket) {
              this.socket.destroy();
            }
            reject(new Error(`Connection timeout (attempt ${attempt + 1}/${retries})`));
          }, 10000);

          this.socket = net.createConnection(this.port, this.host, () => {
            clearTimeout(timeout);
            this.connected = true;
            console.log(`RCON TCP connected to ${this.host}:${this.port}`);
            resolve();
          });

          this.socket.on('error', (error) => {
            clearTimeout(timeout);
            this.connected = false;
            reject(error);
          });

          this.socket.on('close', () => {
            this.connected = false;
            this.authenticated = false;
          });

          // Handle incoming data
          let buffer = Buffer.alloc(0);
          this.socket.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
            
            while (true) {
              const packet = this.parsePacket(buffer);
              if (!packet) break;

              buffer = buffer.slice(packet.size);

              // Handle authentication response
              if (packet.type === PACKET_TYPES.SERVERDATA_AUTH_RESPONSE) {
                if (packet.id === -1) {
                  // Authentication failed
                  this.authenticated = false;
                  const pending = this.pendingRequests.get(packet.id);
                  if (pending) {
                    this.pendingRequests.delete(packet.id);
                    pending.reject(new Error('RCON authentication failed'));
                  }
                } else {
                  // Authentication successful
                  this.authenticated = true;
                  console.log(`RCON authenticated to ${this.host}:${this.port}`);
                  const pending = this.pendingRequests.get(packet.id);
                  if (pending) {
                    this.pendingRequests.delete(packet.id);
                    pending.resolve(true);
                  }
                }
              }
              // Handle command response
              else if (packet.type === PACKET_TYPES.SERVERDATA_RESPONSE_VALUE) {
                const pending = this.pendingRequests.get(packet.id);
                if (pending) {
                  this.pendingRequests.delete(packet.id);
                  pending.resolve(packet.body);
                }
              }
            }
          });
        });

        // Authenticate
        await this.authenticate();

        return true;
      } catch (error) {
        this.connected = false;
        this.authenticated = false;

        if (attempt < retries - 1) {
          console.log(`RCON connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(this.requestId);
        reject(new Error('Authentication timeout'));
      }, 10000);

      const id = ++this.requestId;
      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const packet = this.buildPacket(id, PACKET_TYPES.SERVERDATA_AUTH, this.password);
      this.socket.write(packet);
    });
  }

  async execute(command) {
    if (!this.connected || !this.authenticated || !this.socket) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(this.requestId);
        reject(new Error('Command timeout'));
      }, 10000);

      const id = ++this.requestId;
      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value || 'Command executed successfully');
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      try {
        const packet = this.buildPacket(id, PACKET_TYPES.SERVERDATA_EXECCOMMAND, command);
        this.socket.write(packet);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        this.connected = false;
        this.authenticated = false;
        reject(error);
      }
    });
  }

  async disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
    this.authenticated = false;
    this.pendingRequests.clear();
  }

  isConnected() {
    return this.connected && this.authenticated;
  }
}

export default RconClient;

