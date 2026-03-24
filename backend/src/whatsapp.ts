import { Client, LocalAuth, Chat, MessageMedia, Contact as WAContact } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export type ConnectionStatus = 'disconnected' | 'qr_ready' | 'ready';

interface WhatsAppState {
  status: ConnectionStatus;
  qr: string | null;
  client: Client | null;
}

const state: WhatsAppState = {
  status: 'disconnected',
  qr: null,
  client: null,
};

export const whatsappEvents = new EventEmitter();

export function getStatus(): ConnectionStatus {
  return state.status;
}

export function getQR(): string | null {
  return state.qr;
}

export function initWhatsApp() {
  if (state.client) return;

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '../../data/.wwebjs_auth'),
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    state.qr = qr;
    state.status = 'qr_ready';
    whatsappEvents.emit('status_change', { status: 'qr_ready', qr });
    console.log('[WhatsApp] QR code received');
  });

  client.on('ready', () => {
    state.qr = null;
    state.status = 'ready';
    whatsappEvents.emit('status_change', { status: 'ready', qr: null });
    console.log('[WhatsApp] Client ready');
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated');
  });

  client.on('auth_failure', (msg) => {
    state.status = 'disconnected';
    state.qr = null;
    whatsappEvents.emit('status_change', { status: 'disconnected', qr: null });
    console.error('[WhatsApp] Auth failure:', msg);
  });

  client.on('disconnected', (reason) => {
    state.status = 'disconnected';
    state.qr = null;
    state.client = null;
    whatsappEvents.emit('status_change', { status: 'disconnected', qr: null });
    console.log('[WhatsApp] Disconnected:', reason);
  });

  client.initialize();
  state.client = client;
}

export async function sendMessage(recipient: string, message: string, mediaPath?: string | null): Promise<void> {
  if (!state.client || state.status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  const chatId = recipient.includes('@') ? recipient : `${recipient}@c.us`;

  if (mediaPath && fs.existsSync(mediaPath)) {
    const ext = path.extname(mediaPath).slice(1).toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp',
    };
    const mimetype = mimeMap[ext] ?? 'image/png';
    const data = fs.readFileSync(mediaPath).toString('base64');
    const media = new MessageMedia(mimetype, data, path.basename(mediaPath));
    await state.client.sendMessage(chatId, media, { caption: message || undefined });
  } else {
    await state.client.sendMessage(chatId, message);
  }
}

export interface Contact {
  id: string;
  name: string;
  isGroup: boolean;
}

export async function getContacts(): Promise<Contact[]> {
  if (!state.client || state.status !== 'ready') {
    return [];
  }

  const [chats, waContacts] = await Promise.all([
    state.client.getChats() as Promise<Chat[]>,
    state.client.getContacts() as Promise<WAContact[]>,
  ]);

  const results = new Map<string, Contact>();

  // Add WhatsApp contacts from address book — only standard @c.us IDs (not @lid duplicates)
  for (const c of waContacts) {
    const name = c.name || c.pushname;
    if (!name || c.id.server !== 'c.us') continue;
    results.set(c.id._serialized, { id: c.id._serialized, name, isGroup: false });
  }

  // Add groups from chats
  for (const chat of chats) {
    if (chat.isGroup && chat.name) {
      results.set(chat.id._serialized, { id: chat.id._serialized, name: chat.name, isGroup: true });
    }
  }

  return Array.from(results.values()).sort((a, b) => a.name.localeCompare(b.name));
}
