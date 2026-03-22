import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Contact, Template } from '../api';
import TemplateSelector from '../components/TemplateSelector';
import './Schedule.css';

export default function Schedule() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getContacts().then(setContacts);
    api.getTemplates().then(setTemplates);
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !message || !scheduledAt) return;
    setError('');
    setLoading(true);
    try {
      await api.createMessage({
        recipient: selected.id,
        recipientName: selected.name,
        message,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function toLocalDatetimeInput(date: Date): string {
    // Returns "YYYY-MM-DDTHH:MM" in local time for datetime-local input
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function applyPreset(preset: string) {
    const now = new Date();
    let target: Date;

    if (preset === '1min') {
      target = new Date(now.getTime() + 60_000);
    } else if (preset === '5min') {
      target = new Date(now.getTime() + 5 * 60_000);
    } else if (preset === '1hour') {
      target = new Date(now.getTime() + 60 * 60_000);
    } else if (preset === 'this-evening') {
      target = new Date(now);
      target.setHours(19, 0, 0, 0);
    } else if (preset === 'tomorrow-morning') {
      target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow-evening') {
      target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(19, 0, 0, 0);
    } else if (preset === 'next-sunday-morning') {
      target = new Date(now);
      const daysUntilSunday = (7 - target.getDay()) % 7 || 7;
      target.setDate(target.getDate() + daysUntilSunday);
      target.setHours(9, 0, 0, 0);
    } else if (preset === 'next-monday-evening') {
      target = new Date(now);
      const daysUntilMonday = (8 - target.getDay()) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      target.setHours(19, 0, 0, 0);
    } else {
      return;
    }

    setScheduledAt(toLocalDatetimeInput(target));
  }

  // Min datetime = now + 1 minute
  const minDatetime = toLocalDatetimeInput(new Date(Date.now() + 60_000));

  return (
    <div className="schedule-page">
      <h1 className="page-title">Schedule a Message</h1>

      <form className="card schedule-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">Recipient</label>
          <input
            className="input"
            placeholder="Search contacts or groups…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
          />
          {search && !selected && filtered.length > 0 && (
            <ul className="contact-dropdown">
              {filtered.slice(0, 8).map((c) => (
                <li
                  key={c.id}
                  className="contact-option"
                  onClick={() => {
                    setSelected(c);
                    setSearch(c.name);
                  }}
                >
                  <span className="contact-icon">{c.isGroup ? '👥' : '👤'}</span>
                  {c.name}
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <p className="selected-hint">
              {selected.isGroup ? '👥 Group' : '👤 Contact'}: {selected.name}
            </p>
          )}
        </div>

        <TemplateSelector templates={templates} onSelect={setMessage} />

        <div className="field">
          <label className="field-label">Message</label>
          <textarea
            className="input textarea"
            rows={4}
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field-label">Send at</label>
          <select
            className="input preset-select"
            value=""
            onChange={(e) => { applyPreset(e.target.value); e.target.value = ''; }}
          >
            <option value="" disabled>Quick pick…</option>
            <option value="1min">In 1 minute</option>
            <option value="5min">In 5 minutes</option>
            <option value="1hour">In an hour</option>
            <option value="this-evening">This evening (7:00 PM)</option>
            <option value="tomorrow-morning">Tomorrow morning (9:00 AM)</option>
            <option value="tomorrow-evening">Tomorrow evening (7:00 PM)</option>
            <option value="next-sunday-morning">Next Sunday morning (9:00 AM)</option>
            <option value="next-monday-evening">Next Monday evening (7:00 PM)</option>
          </select>
          <input
            type="datetime-local"
            className="input"
            min={minDatetime}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !selected || !message || !scheduledAt}
        >
          {loading ? 'Scheduling…' : 'Schedule Message'}
        </button>
      </form>
    </div>
  );
}
