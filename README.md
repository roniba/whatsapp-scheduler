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

### Install & Run

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Connect WhatsApp

On first run, the Dashboard shows a QR code. Scan it with your phone:

> WhatsApp → Settings → Linked Devices → Link a Device

Once connected, the status changes to "Connected" and you can start scheduling messages. The session is saved to disk so you won't need to re-scan after restarting.

## Usage

- **Dashboard** — connection status and upcoming/sent messages
- **Schedule** — pick a contact or group, write a message, set a time
- **Templates** — save reusable messages to insert quickly when scheduling
