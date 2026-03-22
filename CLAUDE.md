# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

**Backend** (runs on port 3001):
```bash
cd backend && npm install
npm run dev      # ts-node-dev watch mode
npm run build    # compile TypeScript → dist/
npm start        # run compiled output
```

**Frontend** (runs on port 5173, proxies /api → localhost:3001):
```bash
cd frontend && npm install
npm run dev      # Vite dev server
npm run build    # production build
```

Both must run simultaneously during development.

## Architecture

```
backend/src/
  index.ts       — Express server entry; calls initWhatsApp() + startScheduler() on boot
  whatsapp.ts    — whatsapp-web.js singleton; owns connection state (disconnected|qr_ready|ready),
                   QR string, and exports sendMessage() / getContacts()
  scheduler.ts   — node-schedule job (every minute); queries pending messages from DB, calls sendMessage()
  db.ts          — better-sqlite3 wrapper; owns schema init + all query helpers
  routes/
    status.ts    — GET /api/status (returns status + QR as data URL), GET /api/contacts
    messages.ts  — CRUD for scheduled_messages table
    templates.ts — CRUD for templates table

frontend/src/
  api.ts         — typed fetch wrappers for all backend endpoints
  App.tsx        — BrowserRouter + nav + routes
  pages/
    Dashboard    — polls /api/status every 3s until connected; shows QR or upcoming messages
    Schedule     — contact/group type-ahead picker, template selector, datetime-local input
    Templates    — create/delete reusable message templates
  components/
    QRCode       — renders QR data URL image
    MessageList  — renders scheduled/sent/failed messages with cancel button for pending
    TemplateSelector — dropdown that injects template text into message field
    shared.css   — all shared utility classes (card, input, btn-primary, etc.)
```

## Key Design Decisions

- **LocalAuth strategy**: WhatsApp session is persisted to `data/.wwebjs_auth/` so re-scanning QR is not needed on restart.
- **SQLite location**: `data/scheduler.db` — created automatically on first run, outside `src/`.
- **Recipient format**: Contacts use WhatsApp chat ID (`<number>@c.us` or `<id>@g.us`). The `recipient` column stores the full chat ID; `recipient_name` stores the display name for UI.
- **Scheduler granularity**: Messages are dispatched at most 1 minute late (cron runs every minute). The scheduler skips entirely if WhatsApp is not in `ready` state.
- **Frontend proxy**: Vite proxies `/api/*` to `http://localhost:3001` so there are no CORS issues in dev. In production, serve the built frontend from Express or configure a reverse proxy.
