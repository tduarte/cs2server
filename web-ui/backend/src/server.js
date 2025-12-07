import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CS2 Server Web UI Backend running on port ${PORT}`);
  console.log(`RCON Host: ${process.env.RCON_HOST || 'cs2-server'}`);
  console.log(`RCON Port: ${process.env.RCON_PORT || '27015'}`);
});

