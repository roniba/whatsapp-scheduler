import { Router, Request, Response } from 'express';
import { getAllMessages, createMessage, deleteMessage } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(getAllMessages());
});

router.post('/', (req: Request, res: Response) => {
  const { recipient, recipientName, message, scheduledAt } = req.body;

  if (!recipient || !message || !scheduledAt) {
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

  const msg = createMessage(recipient, recipientName ?? null, message, scheduledDate.toISOString());
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
