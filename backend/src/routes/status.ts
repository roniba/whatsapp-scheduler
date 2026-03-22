import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { getStatus, getQR, getContacts } from '../whatsapp';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  const status = getStatus();
  const qrRaw = getQR();
  let qrDataUrl: string | null = null;

  if (qrRaw) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrRaw);
    } catch {
      qrDataUrl = null;
    }
  }

  res.json({ status, qr: qrDataUrl });
});

router.get('/contacts', async (_req: Request, res: Response) => {
  try {
    const contacts = await getContacts();
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

export default router;
