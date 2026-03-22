import { useEffect, useState } from 'react';
import { api, Template } from '../api';
import './Templates.css';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setTemplates(await api.getTemplates());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createTemplate(name.trim(), message.trim());
      setName('');
      setMessage('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function handleDelete(id: number) {
    await api.deleteTemplate(id);
    load();
  }

  return (
    <div className="templates-page">
      <h1 className="page-title">Templates</h1>

      <div className="templates-layout">
        <section className="card">
          <h2 className="section-title">New Template</h2>
          <form className="template-form" onSubmit={handleCreate}>
            <div className="field">
              <label className="field-label">Name</label>
              <input
                className="input"
                placeholder="e.g. Birthday greeting"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Message</label>
              <textarea
                className="input textarea"
                rows={4}
                placeholder="Type the template message…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={!name || !message}>
              Save Template
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="section-title">Saved Templates</h2>
          {templates.length === 0 ? (
            <p className="empty-state">No templates yet.</p>
          ) : (
            <ul className="template-list">
              {templates.map((t) => (
                <li key={t.id} className="template-item">
                  <div className="template-header">
                    <span className="template-name">{t.name}</span>
                    <button className="btn-danger-sm" onClick={() => handleDelete(t.id)}>
                      Delete
                    </button>
                  </div>
                  <p className="template-message">{t.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
