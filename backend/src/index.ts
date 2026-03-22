import express from 'express';
import cors from 'cors';
import path from 'path';
import { initWhatsApp } from './whatsapp';
import { startScheduler } from './scheduler';
import statusRouter from './routes/status';
import messagesRouter from './routes/messages';
import templatesRouter from './routes/templates';
import settingsRouter from './routes/settings';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api', statusRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/settings', settingsRouter);

// Serve the built React frontend
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
app.use(express.static(FRONTEND_DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  initWhatsApp();
  startScheduler();
});
