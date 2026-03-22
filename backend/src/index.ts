import express from 'express';
import cors from 'cors';
import { initWhatsApp } from './whatsapp';
import { startScheduler } from './scheduler';
import statusRouter from './routes/status';
import messagesRouter from './routes/messages';
import templatesRouter from './routes/templates';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api', statusRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/templates', templatesRouter);

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  initWhatsApp();
  startScheduler();
});
