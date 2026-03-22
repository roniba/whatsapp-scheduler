import { Router, Request, Response } from 'express';
import { getAllMessages, createMessage, deleteMessage } from '../db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(__dirname, '../../../data/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(getAllMessages());
});

router.post('/', (req: Request, res: Response) => {
  const { recipient, recipientName, message, scheduledAt, mediaBase64, mediaType } = req.body;

  if (!recipient || (!message && !mediaBase64) || !scheduledAt) {
    res.status(400).json({ error: 'recipient, message, and scheduledAt are required' });
    return;
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime())) {
    res.status(400).json({ error: 'Invalid scheduledAt date' });
    return;
  }

  if (scheduledDate <= new Date()) {
    res.status(400).json({ error: 'scheduledAt must be in the future' });
    return;
  }

  let mediaPath: string | null = null;
  if (mediaBase64 && mediaType) {
    const ext = mediaType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
    const filename = `${crypto.randomUUID()}.${ext}`;
    mediaPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(mediaPath, Buffer.from(mediaBase64, 'base64'));
  }

  const msg = createMessage(recipient, recipientName ?? null, message, scheduledDate.toISOString(), mediaPath);
  res.status(201).json(msg);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  deleteMessage(id);
  res.status(204).send();
});

export default router;
