import { useEffect, useState, useCallback } from 'react';
import { api, StatusResponse, ScheduledMessage } from '../api';
import QRCodeDisplay from '../components/QRCode';
import MessageList from '../components/MessageList';
import './Dashboard.css';

export default function Dashboard() {
  const [statusData, setStatusData] = useState<StatusResponse>({ status: 'disconnected', qr: null });
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);

  const loadMessages = useCallback(async () => {
    const data = await api.getMessages();
    setMessages(data);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function poll() {
      const data = await api.getStatus();
      setStatusData(data);
      if (data.status === 'ready') {
        clearInterval(interval);
        loadMessages();
      }
    }

    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (statusData.status === 'ready') {
      loadMessages();
    }
  }, [statusData.status, loadMessages]);

  async function handleDelete(id: number) {
    await api.deleteMessage(id);
    loadMessages();
  }

  const pending = messages.filter((m) => m.status === 'pending');
  const history = messages.filter((m) => m.status !== 'pending');

  return (
    <div className="dashboard">
      <section className="card">
        <h2 className="section-title">Connection</h2>
        {statusData.status === 'ready' && (
          <div className="status-badge status-connected">Connected</div>
        )}
        {statusData.status === 'qr_ready' && statusData.qr && (
          <div>
            <div className="status-badge status-waiting">Waiting for scan…</div>
            <QRCodeDisplay dataUrl={statusData.qr} />
          </div>
        )}
        {statusData.status === 'disconnected' && (
          <div className="status-badge status-disconnected">Disconnected — starting up…</div>
        )}
      </section>

      {statusData.status === 'ready' && (
        <>
          <section className="card">
            <h2 className="section-title">Upcoming Messages</h2>
            <MessageList messages={pending} onDelete={handleDelete} />
          </section>

          {history.length > 0 && (
            <section className="card">
              <h2 className="section-title">History</h2>
              <MessageList messages={history} onDelete={handleDelete} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
