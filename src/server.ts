import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import generateRouter from './routes/generate';
import uploadLogoRouter from './routes/upload-logo';
import { ensureGeneratedDir, ensureLogosDir } from './lib/image-storage';
import { startKeepAlive } from './lib/keep-alive';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory (for generated images and logos)
app.use(express.static(path.join(process.cwd(), 'public')));

// Ensure directories exist
ensureGeneratedDir();
ensureLogosDir();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/generate', generateRouter);
app.use('/api/upload-logo', uploadLogoRouter);

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
  POST /api/generate     - Generate product images
  POST /api/upload-logo  - Upload logo file
  GET  /health           - Health check

Generated images served at: /generated/{filename}
Logo files served at: /logos/{filename}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Start keep-alive cron (only activates on Render)
  startKeepAlive();
});

export default app;
