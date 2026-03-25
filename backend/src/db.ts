import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/scheduler.db');

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new DatabaseSync(DB_PATH);
    initSchema(db);
  }
  return db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      recipient_name TEXT,
      message TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      sent_at TEXT,
      status TEXT DEFAULT 'pending',
      media_path TEXT
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration: add media_path column if it doesn't exist yet
  try {
    db.exec(`ALTER TABLE scheduled_messages ADD COLUMN media_path TEXT`);
  } catch {
    // Column already exists — safe to ignore
  }
}

export interface ScheduledMessage {
  id: number;
  recipient: string;
  recipient_name: string | null;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  media_path: string | null;
}

export interface Template {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export function getPendingMessages(): ScheduledMessage[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM scheduled_messages WHERE status = 'pending' AND scheduled_at <= ? ORDER BY scheduled_at ASC`)
    .all(new Date().toISOString()) as unknown as ScheduledMessage[];
}

export function getAllMessages(): ScheduledMessage[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM scheduled_messages ORDER BY scheduled_at DESC`)
    .all() as unknown as ScheduledMessage[];
}

export function createMessage(
  recipient: string,
  recipientName: string | null,
  message: string,
  scheduledAt: string,
  mediaPath?: string | null
): ScheduledMessage {
  const db = getDb();
  const result = db
    .prepare(`INSERT INTO scheduled_messages (recipient, recipient_name, message, scheduled_at, media_path) VALUES (?, ?, ?, ?, ?)`)
    .run(recipient, recipientName, message, scheduledAt, mediaPath ?? null);
  return db
    .prepare(`SELECT * FROM scheduled_messages WHERE id = ?`)
    .get(result.lastInsertRowid) as unknown as ScheduledMessage;
}

export function rescheduleMessage(id: number, scheduledAt: string) {
  getDb()
    .prepare(`UPDATE scheduled_messages SET scheduled_at = ?, status = 'pending', sent_at = NULL WHERE id = ? AND status IN ('pending', 'failed')`)
    .run(scheduledAt, id);
}

export function updateMessageStatus(id: number, status: 'sent' | 'failed', sentAt?: string) {
  getDb()
    .prepare(`UPDATE scheduled_messages SET status = ?, sent_at = ? WHERE id = ?`)
    .run(status, sentAt ?? null, id);
}

export function deleteMessage(id: number) {
  getDb()
    .prepare(`DELETE FROM scheduled_messages WHERE id = ?`)
    .run(id);
}

export function getAllTemplates(): Template[] {
  return getDb().prepare(`SELECT * FROM templates ORDER BY name ASC`).all() as unknown as Template[];
}

export function createTemplate(name: string, message: string): Template {
  const db = getDb();
  const result = db
    .prepare(`INSERT INTO templates (name, message, created_at) VALUES (?, ?, ?)`)
    .run(name, message, new Date().toISOString());
  return db.prepare(`SELECT * FROM templates WHERE id = ?`).get(result.lastInsertRowid) as unknown as Template;
}

export function deleteTemplate(id: number) {
  getDb().prepare(`DELETE FROM templates WHERE id = ?`).run(id);
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb().prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, value);
}

export function deleteSetting(key: string) {
  getDb().prepare(`DELETE FROM settings WHERE key = ?`).run(key);
}
