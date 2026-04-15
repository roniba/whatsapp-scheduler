import { Client, LocalAuth, Chat, MessageMedia, Contact as WAContact } from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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

  client.initialize().catch((err: unknown) => {
    handlePuppeteerError(err);
    // If handlePuppeteerError didn't recognize the error pattern, force a reset anyway
    if (state.client === client) {
      state.status = 'disconnected';
      state.qr = null;
      state.client = null;
      whatsappEvents.emit('status_change', { status: 'disconnected', qr: null });
      killStaleChromeProcess();
      setTimeout(() => initWhatsApp(), 5000);
    }
  });
  state.client = client;
}

export async function sendMessage(recipient: string, message: string, mediaPath?: string | null): Promise<void> {
  if (!state.client || state.status !== 'ready') {
    throw new Error('WhatsApp client is not ready');
  }
  const chatId = recipient.includes('@') ? recipient : `${recipient}@c.us`;

  try {
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
  } catch (err) {
    handlePuppeteerError(err);
    throw err;
  }
}

export interface Contact {
  id: string;
  name: string;
  isGroup: boolean;
}

function killStaleChromeProcess() {
  const lockFile = path.join(__dirname, '../../data/.wwebjs_auth/session/SingletonLock');
  try {
    // SingletonLock is a symlink pointing to "hostname-PID"
    const target = fs.readlinkSync(lockFile);
    const pid = parseInt(target.split('-').pop() ?? '', 10);
    if (pid) {
      process.kill(pid, 'SIGKILL');
      console.log(`[WhatsApp] Killed stale Chrome process PID ${pid}`);
    }
  } catch {
    // Lock file absent or process already gone — try a broader pkill as fallback
    try {
      execSync('pkill -9 -f wwebjs_auth', { stdio: 'ignore' });
    } catch { /* nothing left to kill */ }
  }
}

function handlePuppeteerError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('detached Frame') || msg.includes('Target closed') || msg.includes('Session closed') || msg.includes('Page.navigate timed out') || msg.includes('ProtocolError') || msg.includes('auth timeout')) {
    console.error('[WhatsApp] Puppeteer error detected, reinitializing:', msg);

    const oldClient = state.client;
    state.status = 'disconnected';
    state.qr = null;
    state.client = null;
    whatsappEvents.emit('status_change', { status: 'disconnected', qr: null });

    // Destroy the old client first, then kill any lingering Chrome, then reinit
    const cleanup = oldClient
      ? oldClient.destroy().catch(() => {})
      : Promise.resolve();

    cleanup.finally(() => {
      killStaleChromeProcess();
      setTimeout(() => initWhatsApp(), 3000);
    });
  }
}

export async function getContacts(): Promise<Contact[]> {
  if (!state.client || state.status !== 'ready') {
    return [];
  }

  const results = new Map<string, Contact>();

  try {
    const chats = await state.client.getChats() as Chat[];

    // Try to get the full address book; fall back gracefully
    let waContacts: WAContact[] = [];
    try {
      waContacts = await state.client.getContacts() as WAContact[];
    } catch {
      // Fall back to contacts extracted from chats only
    }

    // Add address-book contacts with valid @c.us IDs
    for (const c of waContacts) {
      const name = c.name || c.pushname;
      if (!name || c.id.server !== 'c.us') continue;
      results.set(c.id._serialized, { id: c.id._serialized, name, isGroup: false });
    }

    // Add all chats (groups + individuals) — covers anyone not in address book
    for (const chat of chats) {
      if (!chat.name) continue;
      if (!results.has(chat.id._serialized)) {
        results.set(chat.id._serialized, { id: chat.id._serialized, name: chat.name, isGroup: chat.isGroup });
      }
    }
  } catch (err) {
    handlePuppeteerError(err);
    return [];
  }

  return Array.from(results.values()).sort((a, b) => a.name.localeCompare(b.name));
}
