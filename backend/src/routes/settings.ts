import { Router } from 'express';
import { getSetting, setSetting, deleteSetting } from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const recipient = getSetting('notification_recipient');
  const recipientName = getSetting('notification_recipient_name');
  res.json({ recipient, recipientName });
});

router.put('/', (req, res) => {
  const { recipient, recipientName } = req.body;
  if (recipient) {
    setSetting('notification_recipient', recipient);
    setSetting('notification_recipient_name', recipientName ?? recipient);
  } else {
    deleteSetting('notification_recipient');
    deleteSetting('notification_recipient_name');
  }
  res.json({ ok: true });
});

export default router;
