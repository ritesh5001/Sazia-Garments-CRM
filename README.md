# Sazia Garments CRM

A CRM / business-management system for Sazia Garments — inventory, sales, purchases,
payments, vendors, customers, orders, and reporting.

**Stack:** MongoDB · Express · React · Node.js (MERN), TypeScript throughout.

```
server/   # Express + TypeScript + Mongoose API
client/   # Vite + React + TypeScript + Tailwind
```

## Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

## Setup

```bash
# 1. Server
cd server
cp .env.example .env        # adjust MONGODB_URI / secrets as needed
npm install

# 2. Client
cd ../client
npm install
```

## Running (development)

Open two terminals:

```bash
# Terminal 1 — API (http://localhost:5050)
cd server && npm run dev

# Terminal 2 — Web app (http://localhost:5173)
cd client && npm run dev
```

Then open **http://localhost:5173**. The Vite dev server proxies `/api/*` to the server.

## First login

The very first time you open the app (no users in the DB yet), the login screen
switches to **"Create the first admin account"** — fill it in to bootstrap an admin.

Alternatively, seed an admin from the CLI (uses `SEED_ADMIN_*` from `.env`):

```bash
cd server && npm run seed
# default: admin@sazia.local / admin12345
```

## Auth model

- JWT access token (short-lived, sent as `Authorization: Bearer`).
- Refresh token in an HTTP-only cookie; the client silently refreshes on 401.
- Roles: `admin` (full access) and `staff` (scoped). Route-level RBAC via `requireRole`.

## Build (production)

```bash
cd server && npm run build && npm start
cd client && npm run build      # outputs static files to client/dist
```

## Roadmap

This is **Phase 1** (foundation, auth, app shell). Remaining phases — Customers/Vendors,
Inventory, Invoices, Purchases, Payments & Ledgers, Orders, Dashboard KPIs, Reports,
User Management, and Deployment — are tracked in the project plan. Each module already
has a placeholder route in the sidebar.
```
