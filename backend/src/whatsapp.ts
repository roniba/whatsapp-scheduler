import { Client, LocalAuth, Chat } from 'whatsapp-web.js';
import { EventEmitter } from 'events';
import path from 'path';

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

export async function sendMessage(recipient: string, message: string): Promise<void> {
  if (!state.client || state.status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  // recipient is either a phone number (e.g. "15551234567") or a group chat ID (e.g. "XXXXX@g.us")
  const chatId = recipient.includes('@') ? recipient : `${recipient}@c.us`;
  await state.client.sendMessage(chatId, message);
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

  const chats: Chat[] = await state.client.getChats();

  return chats
    .filter((chat) => chat.name)
    .map((chat) => ({
      id: chat.id._serialized,
      name: chat.name,
      isGroup: chat.isGroup,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
