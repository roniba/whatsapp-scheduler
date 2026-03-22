import { Router, Request, Response } from 'express';
import { getAllTemplates, createTemplate, deleteTemplate } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(getAllTemplates());
});

router.post('/', (req: Request, res: Response) => {
  const { name, message } = req.body;
  if (!name || !message) {
    res.status(400).json({ error: 'name and message are required' });
    return;
  }
  const template = createTemplate(name.trim(), message.trim());
  res.status(201).json(template);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  deleteTemplate(id);
  res.status(204).send();
});

export default router;
