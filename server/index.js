import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ccusageRoutes from './routes/ccusage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const distPath = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/ccusage', ccusageRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built frontend
app.use((req, res, next) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) return next();

  const filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  const resolved = path.resolve(filePath);

  // Security: ensure the file is within dist/
  if (!resolved.startsWith(path.resolve(distPath))) {
    return res.status(403).end();
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return res.sendFile(resolved);
  }

  // SPA fallback
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ccusage-dashboard running on http://localhost:${PORT}`);
});
