import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Templates from './pages/Templates';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
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
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Schedule />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/templates" element={<Templates />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
