import { ScheduledMessage } from '../api';

interface Props {
  messages: ScheduledMessage[];
  onDelete?: (id: number) => void;
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

export default function MessageList({ messages, onDelete }: Props) {
  if (messages.length === 0) {
    return <p className="empty-state">No scheduled messages.</p>;
  }

  return (
    <ul className="message-list">
      {messages.map((msg) => (
        <li key={msg.id} className="message-item">
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
            <span className="message-time">
              {msg.status === 'sent' && msg.sent_at
                ? `Sent ${formatDate(msg.sent_at)}`
                : `Scheduled for ${formatDate(msg.scheduled_at)}`}
            </span>
            {onDelete && (
              <button
                className="btn-danger-sm"
                onClick={() => onDelete(msg.id)}
              >
                {msg.status === 'pending' ? 'Cancel' : 'Remove'}
              </button>
            )}
          </div>
        </li>
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
