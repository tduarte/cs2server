import Rcon from 'rcon';

class RconClient {
  constructor(host, port, password) {
    this.host = host;
    this.port = port;
    this.password = password;
    this.client = null;
    this.connected = false;
    this.responseQueue = [];
    this.currentResolve = null;
  }

  async connect(retries = 5, delay = 2000) {
    if (this.connected && this.client) {
      return true;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        // Clean up previous client if exists
        if (this.client) {
          try {
            this.client.removeAllListeners();
            this.client.disconnect();
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        this.client = Rcon(this.host, this.port, this.password);

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.client.removeAllListeners();
            reject(new Error(`Connection timeout (attempt ${attempt + 1}/${retries})`));
          }, 10000);

          this.client.on('auth', () => {
            clearTimeout(timeout);
            this.connected = true;
            console.log(`RCON connected to ${this.host}:${this.port}`);
            resolve(true);
          });

          this.client.on('response', (response) => {
            if (this.currentResolve) {
              this.currentResolve(response);
              this.currentResolve = null;
            } else {
              this.responseQueue.push(response);
            }
          });

          this.client.on('error', (error) => {
            clearTimeout(timeout);
            this.connected = false;
            if (this.currentResolve) {
              this.currentResolve = null;
            }
            reject(error);
          });

          this.client.on('end', () => {
            this.connected = false;
          });
        });
      } catch (error) {
        this.connected = false;
        
        if (attempt < retries - 1) {
          console.log(`RCON connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
  }

  async execute(command) {
    if (!this.connected || !this.client) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.currentResolve = null;
        reject(new Error('Command timeout'));
      }, 10000);

      this.currentResolve = (response) => {
        clearTimeout(timeout);
        resolve(response || 'Command executed successfully');
      };

      try {
        this.client.send(command);
      } catch (error) {
        clearTimeout(timeout);
        this.currentResolve = null;
        this.connected = false;
        reject(error);
      }
    });
  }

  async disconnect() {
    if (this.client && this.connected) {
      try {
        this.client.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default RconClient;

