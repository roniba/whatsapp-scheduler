# WhatsApp Scheduler

A web app to schedule WhatsApp messages to individual contacts and groups, using WhatsApp Web automation — no paid API required.

## Features

- Schedule messages to any contact or group
- Quick-pick time presets (in 1 minute, this evening, tomorrow morning, etc.)
- Reusable message templates
- Automatic delivery in the background
- Session persistence — scan QR once, stays connected across restarts

## Tech Stack

- **Backend**: Node.js + Express + TypeScript, `whatsapp-web.js`, `node-schedule`, built-in `node:sqlite`
- **Frontend**: React + TypeScript + Vite

## Getting Started

### Prerequisites

- Node.js v22 or later
- A WhatsApp account

---

## Local Development

Install dependencies and run both servers simultaneously.

**Terminal 1 — Backend** (runs on port 3001):
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend** (runs on port 5173):
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

The frontend Vite dev server proxies all `/api/*` requests to the backend, so there are no CORS issues during development.

---

## Production Setup

In production, the backend serves the compiled frontend as static files — only one process needs to run.

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Build both projects

```bash
cd frontend && npm run build   # outputs to frontend/dist/
cd ../backend && npm run build # outputs to backend/dist/
```

### 3. Update ecosystem.config.js

Open `ecosystem.config.js` in the project root and update the `cwd` path to match where the project lives on your machine:

```js
cwd: '/your/actual/path/to/whatsapp-scheduler',
```

### 4. Start with PM2

```bash
npm install -g pm2          # install PM2 globally (one time)
pm2 start ecosystem.config.js
```

Then open [http://localhost:3001](http://localhost:3001).

---

## Connect WhatsApp

On first run, the Dashboard shows a QR code. Scan it with your phone:

> WhatsApp → Settings → Linked Devices → Link a Device

Once connected, the status changes to "Connected" and you can start scheduling messages. The session is saved to `data/.wwebjs_auth/` so you won't need to re-scan after restarting.

---

## PM2 — Process Management

[PM2](https://pm2.keymetrics.io/) is a process manager for Node.js. It keeps the app running in the background, restarts it automatically if it crashes, and survives machine reboots (with one extra setup step).

### Common commands

| Command | What it does |
|---|---|
| `pm2 start ecosystem.config.js` | Start the app |
| `pm2 stop whatsapp-scheduler` | Stop the app |
| `pm2 restart whatsapp-scheduler` | Restart the app |
| `pm2 reload whatsapp-scheduler` | Zero-downtime reload |
| `pm2 status` | Show all running processes |
| `pm2 logs whatsapp-scheduler` | Stream live logs |
| `pm2 logs whatsapp-scheduler --lines 100` | Show last 100 log lines |
| `pm2 delete whatsapp-scheduler` | Remove from PM2 process list |

### Auto-start on system boot

```bash
pm2 startup        # prints a command — run that command as instructed
pm2 save           # saves the current process list so it's restored on reboot
```

### Deploying updates

After pulling new code and rebuilding:

```bash
cd frontend && npm run build
cd ../backend && npm run build
pm2 restart whatsapp-scheduler
```

---

## Usage

- **Dashboard** — connection status and upcoming/sent messages
- **Schedule** — pick a contact or group, write a message, set a time
- **Templates** — save reusable messages to insert quickly when scheduling
