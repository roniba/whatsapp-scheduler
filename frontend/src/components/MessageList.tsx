import { useState } from 'react';
import { ScheduledMessage } from '../api';

interface Props {
  messages: ScheduledMessage[];
  onDelete?: (id: number) => void;
  onReschedule?: (id: number, scheduledAt: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '⏳ Pending',
  sent: '✅ Sent',
  failed: '❌ Failed',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'status-pending',
  sent: 'status-sent',
  failed: 'status-failed',
};

function toLocalDatetimeInput(iso: string | Date): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MessageItem({ msg, onDelete, onReschedule }: {
  msg: ScheduledMessage;
  onDelete?: (id: number) => void;
  onReschedule?: (id: number, scheduledAt: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newTime, setNewTime] = useState('');

  const minDatetime = toLocalDatetimeInput(new Date(Date.now() + 60_000).toISOString());

  function startEdit() {
    setNewTime(toLocalDatetimeInput(msg.scheduled_at));
    setEditing(true);
  }

  function confirmEdit() {
    if (!newTime || !onReschedule) return;
    onReschedule(msg.id, new Date(newTime).toISOString());
    setEditing(false);
  }

  return (
    <li className="message-item">
      <div className="message-meta">
        <span className="message-recipient">{msg.recipient_name ?? msg.recipient}</span>
        <span className={`message-status ${STATUS_CLASS[msg.status]}`}>
          {STATUS_LABEL[msg.status]}
        </span>
      </div>
      {msg.message && <p className="message-body">{msg.message}</p>}
      {msg.media_path && (
        <img
          src={`/uploads/${msg.media_path.split('/').pop()}`}
          alt="Attachment"
          className="message-thumbnail"
        />
      )}
      <div className="message-footer">
        {editing ? (
          <div className="reschedule-row">
            <input
              type="datetime-local"
              className="input reschedule-input"
              min={minDatetime}
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <button className="btn-primary reschedule-confirm" onClick={confirmEdit} disabled={!newTime}>
              Save
            </button>
            <button className="btn-cancel-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <span className="message-time">
            {msg.status === 'sent' && msg.sent_at
              ? `Sent ${formatDate(msg.sent_at)}`
              : `Scheduled for ${formatDate(msg.scheduled_at)}`}
            {msg.status === 'pending' && onReschedule && (
              <button className="edit-time-btn" onClick={startEdit} title="Edit send time">✏️</button>
            )}
            {msg.status === 'failed' && onReschedule && (
              <button className="btn-retry" onClick={startEdit}>🔁 Retry</button>
            )}
          </span>
        )}
        {!editing && onDelete && (
          <button className="btn-danger-sm" onClick={() => onDelete(msg.id)}>
            {msg.status === 'pending' ? 'Cancel' : 'Remove'}
          </button>
        )}
      </div>
    </li>
  );
}

export default function MessageList({ messages, onDelete, onReschedule }: Props) {
  if (messages.length === 0) {
    return <p className="empty-state">No scheduled messages.</p>;
  }

  return (
    <ul className="message-list">
      {messages.map((msg) => (
        <MessageItem key={msg.id} msg={msg} onDelete={onDelete} onReschedule={onReschedule} />
      ))}
    </ul>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
