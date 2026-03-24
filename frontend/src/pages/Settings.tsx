import { useEffect, useState } from 'react';
import { api, Contact } from '../api';
import './Schedule.css';

export default function Settings() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function fetchContacts() {
      api.getContacts().then((data) => {
        if (cancelled) return;
        if (data.length > 0) setContacts(data);
        else setTimeout(fetchContacts, 3000);
      });
    }
    fetchContacts();

    api.getSettings().then(({ recipient, recipientName }) => {
      if (recipient) {
        setSelected({ id: recipient, name: recipientName ?? recipient, isGroup: recipient.endsWith('@g.us') });
        setSearch(recipientName ?? recipient);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    await api.saveSettings(selected?.id ?? null, selected?.name ?? null);
    setLoading(false);
    setSaved(true);
  }

  function handleClear() {
    setSelected(null);
    setSearch('');
    setSaved(false);
  }

  return (
    <div className="schedule-page">
      <h1 className="page-title">Settings</h1>

      <div className="card schedule-form">
        <div className="field">
          <label className="field-label">Send delivery notifications to</label>
          <p style={{ fontSize: 13, color: '#6c757d', margin: 0 }}>
            When a scheduled message is sent, a confirmation will be sent to this contact or group.
          </p>
          <input
            className="input"
            placeholder="Search contacts or groups…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
              setSaved(false);
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
                    setSaved(false);
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
              <button
                onClick={handleClear}
                style={{ marginLeft: 12, background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: 13 }}
              >
                Remove
              </button>
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
          {saved && <span style={{ fontSize: 13, color: '#25D366', fontWeight: 500 }}>Saved</span>}
        </div>
      </div>
    </div>
  );
}
