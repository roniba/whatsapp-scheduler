const BASE = '/api';

export interface StatusResponse {
  status: 'disconnected' | 'qr_ready' | 'ready';
  qr: string | null;
}

export interface Contact {
  id: string;
  name: string;
  isGroup: boolean;
}

export interface ScheduledMessage {
  id: number;
  recipient: string;
  recipient_name: string | null;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
}

export interface Template {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export const api = {
  async getStatus(): Promise<StatusResponse> {
    const res = await fetch(`${BASE}/status`);
    return res.json();
  },

  async getContacts(): Promise<Contact[]> {
    const res = await fetch(`${BASE}/contacts`);
    return res.json();
  },

  async getMessages(): Promise<ScheduledMessage[]> {
    const res = await fetch(`${BASE}/messages`);
    return res.json();
  },

  async createMessage(data: {
    recipient: string;
    recipientName: string | null;
    message: string;
    scheduledAt: string;
  }): Promise<ScheduledMessage> {
    const res = await fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to create message');
    }
    return res.json();
  },

  async deleteMessage(id: number): Promise<void> {
    await fetch(`${BASE}/messages/${id}`, { method: 'DELETE' });
  },

  async getTemplates(): Promise<Template[]> {
    const res = await fetch(`${BASE}/templates`);
    return res.json();
  },

  async createTemplate(name: string, message: string): Promise<Template> {
    const res = await fetch(`${BASE}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Failed to create template');
    }
    return res.json();
  },

  async deleteTemplate(id: number): Promise<void> {
    await fetch(`${BASE}/templates/${id}`, { method: 'DELETE' });
  },

  async getSettings(): Promise<{ recipient: string | null; recipientName: string | null }> {
    const res = await fetch(`${BASE}/settings`);
    return res.json();
  },

  async saveSettings(recipient: string | null, recipientName: string | null): Promise<void> {
    await fetch(`${BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, recipientName }),
    });
  },
};
