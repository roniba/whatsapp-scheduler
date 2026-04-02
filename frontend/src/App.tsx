import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import { api } from './api';
import './App.css';

function AppInner() {
  const [status, setStatus] = useState<'disconnected' | 'qr_ready' | 'ready'>('disconnected');
  const location = useLocation();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    async function poll() {
      const data = await api.getStatus();
      setStatus(data.status);
      if (data.status === 'ready') clearInterval(interval);
    }
    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  const onDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <span className="nav-icon">📅</span>
          WhatsApp Scheduler
        </div>
        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Schedule
          </NavLink>
          <NavLink to="/templates" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Templates
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Settings
          </NavLink>
        </div>
      </nav>
      {status !== 'ready' && !onDashboard && (
        <div className={`connection-banner ${status === 'qr_ready' ? 'connection-banner--qr' : 'connection-banner--disconnected'}`}>
          {status === 'disconnected' && 'WhatsApp disconnected — starting up…'}
          {status === 'qr_ready' && (
            <>WhatsApp not connected — <NavLink to="/dashboard" className="connection-banner-link">go to Dashboard to scan QR code</NavLink></>
          )}
        </div>
      )}
      <main className="main">
        <Routes>
          <Route path="/" element={<Schedule />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
