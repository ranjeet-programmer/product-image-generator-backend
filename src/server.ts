import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import generateRouter from './routes/generate';
import { ensureGeneratedDir } from './lib/image-storage';
import { startKeepAlive } from './lib/keep-alive';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for generated images)
app.use(express.static(path.join(process.cwd(), 'public')));

// Ensure generated images directory exists
ensureGeneratedDir();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/generate', generateRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Product Image Generator API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server running at: http://localhost:${PORT}

Endpoints:
  POST /api/generate  - Generate product images
  GET  /health        - Health check

Generated images served at: /generated/{filename}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Start keep-alive cron (only activates on Render)
  startKeepAlive();
});

export default app;
