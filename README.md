# 🚌 BusMaster — Cloud-Based Bus Ticket Booking System

> A full-stack intercity bus ticket booking platform with real-time seat locking, Stripe payments, JWT authentication, and queue-based ticket generation.

**Live Demo:** [ticket-system-phi-woad.vercel.app](https://ticket-system-phi-woad.vercel.app)  
**GitHub:** [github.com/Nova6278/ticket-system](https://github.com/Nova6278/ticket-system)

⚠️ Note: Backend is hosted locally via tunnel.
If the live demo is unavailable, please check back 
after a few minutes or contact me at rajdeepoff78@gmail.com
---

## 📌 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Local Setup Guide](#local-setup-guide)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Test Credentials](#test-credentials)

---

## ✨ Features

- **User Authentication** — Register/login with JWT-based auth and bcrypt password hashing
- **Route Browsing** — Browse all available bus routes from Bhubaneswar
- **Real-time Seat Selection** — Interactive seat map with live availability
- **Seat Locking** — Redis-powered temporary seat holds to prevent double booking
- **Stripe Payments** — Secure test payments via Stripe Payment Intents
- **Ticket Generation** — QR-code based tickets generated after payment via BullMQ queue
- **My Tickets** — View all booked tickets per user

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Neon — serverless) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| Payments | Stripe |
| Auth | JWT + bcryptjs |
| Frontend Host | Vercel |
| Backend Tunnel | ngrok |

---

## 🏗 Architecture

```
┌─────────────────┐        ┌──────────────────────┐
│   Next.js App   │───────▶│   Express API (ngrok) │
│   (Vercel)      │        │   Port 3001           │
└─────────────────┘        └──────────┬───────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                  │
             ┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
             │  PostgreSQL  │  │    Redis     │  │    Stripe    │
             │   (Neon)     │  │  (Upstash)   │  │     API      │
             └─────────────┘  └─────────────┘  └─────────────┘
```

**Request Flow:**
1. User selects seats → Redis temporarily locks them (prevents double booking)
2. User pays via Stripe → Payment Intent created on backend
3. On payment success → BullMQ queue triggers ticket generation
4. Tickets stored in DB with unique QR codes → visible in "My Tickets"

---

## 🗄 Database Schema

```sql
users         → id, email, password_hash, role, created_at
events        → id, title, venue, event_date, total_seats, available_seats
seats         → id, event_id, seat_number, section, price_cents, status
bookings      → id, user_id, event_id, status, total_amount, created_at
tickets       → id, booking_id, seat_id, qr_code, is_used, created_at
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events/routes |
| GET | `/api/events/:id` | Get event + seats |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking + lock seats |
| GET | `/api/bookings` | Get user's bookings |
| GET | `/api/bookings/:id` | Get booking details |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create Stripe payment intent |
| POST | `/api/payments/confirm/:id` | Confirm payment + generate tickets |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | Get user's tickets |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check DB + Redis status |

---

## 💻 Local Setup Guide

### Prerequisites
- Node.js 18+
- npm
- ngrok (for exposing local backend)
- A [Neon](https://neon.tech) account (free PostgreSQL)
- An [Upstash](https://upstash.com) account (free Redis)
- A [Stripe](https://stripe.com) account (test mode)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Nova6278/ticket-system.git
cd ticket-system
```

---

### Step 2 — Set up the database (Neon)

1. Go to [neon.tech](https://neon.tech) → create a free project
2. Go to **SQL Editor** and run each migration file in order:
   - `apps/api/src/db/migrations/001_create_users.sql`
   - `apps/api/src/db/migrations/002_create_events.sql`
   - `apps/api/src/db/migrations/003_create_seats.sql`
   - `apps/api/src/db/migrations/004_create_bookings.sql`
   - `apps/api/src/db/migrations/005_create_tickets.sql`

3. Seed some test data:

```sql
-- Add routes
INSERT INTO events (id, title, venue, event_date, total_seats, available_seats) VALUES
(gen_random_uuid(), 'Bhubaneswar → Kolkata', 'Bhubaneswar Bus Terminal', NOW() + interval '1 day', 40, 40),
(gen_random_uuid(), 'Bhubaneswar → Puri', 'Bhubaneswar Bus Terminal', NOW() + interval '2 hours', 40, 40),
(gen_random_uuid(), 'Bhubaneswar → Cuttack', 'Bhubaneswar Bus Terminal', NOW() + interval '3 hours', 40, 40),
(gen_random_uuid(), 'Bhubaneswar → Delhi', 'Bhubaneswar Bus Terminal', NOW() + interval '2 days', 45, 45),
(gen_random_uuid(), 'Bhubaneswar → Hyderabad', 'Bhubaneswar Bus Terminal', NOW() + interval '8 hours', 40, 40);

-- Add seats for all events
INSERT INTO seats (id, event_id, seat_number, status, price_cents)
SELECT gen_random_uuid(), e.id, 'S' || gs.seat_num, 'available', 49900
FROM events e
CROSS JOIN generate_series(1, 40) AS gs(seat_num);
```

---

### Step 3 — Set up Redis (Upstash)

1. Go to [upstash.com](https://upstash.com) → create a free Redis database
2. Copy the **Redis URL** — looks like `redis://default:password@host:port`

---

### Step 4 — Configure backend environment

```bash
cd apps/api
```

Create a `.env` file:

```env
PORT=3001
NODE_ENV=development

DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=your_neon_password

REDIS_URL=redis://default:yourpass@your-upstash-host:port

JWT_SECRET=any-long-random-string
TICKET_SECRET=another-long-random-string

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

---

### Step 5 — Start the backend

```bash
cd apps/api
npm install
npm run build
npm start
```

You should see:
```
Server running on port 3001
Connected to Redis
```

---

### Step 6 — Expose backend via ngrok

```bash
ngrok http 3001
```

Copy the URL — e.g. `https://abc123.ngrok-free.app`

---

### Step 7 — Configure and start the frontend

```bash
cd apps/web
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://abc123.ngrok-free.app/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3001) |
| `DB_HOST` | Neon PostgreSQL host |
| `DB_PORT` | PostgreSQL port (5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `REDIS_URL` | Upstash Redis connection URL |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `TICKET_SECRET` | Secret for ticket generation |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |

### Frontend (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |

---

## 🚀 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel (Root dir: `apps/web`) |
| Backend | Local + ngrok tunnel |
| Database | Neon (serverless PostgreSQL) |
| Cache | Upstash (serverless Redis) |

---

## 🧪 Test Credentials

Use these to test the live demo without registering:

| Field | Value |
|-------|-------|
| Email | `test@busmaster.com` |
| Password | `test1234` |

**Stripe test card:**
| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |

---

## 📁 Project Structure

```
ticket-system/
├── apps/
│   ├── api/                    ← Express backend
│   │   ├── src/
│   │   │   ├── config/         ← DB, Redis, env config
│   │   │   ├── db/migrations/  ← SQL migration files
│   │   │   ├── middleware/     ← JWT auth middleware
│   │   │   ├── modules/        ← Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── bookings/
│   │   │   │   ├── events/
│   │   │   │   ├── payments/
│   │   │   │   └── tickets/
│   │   │   └── app.ts          ← Express entry point
│   │   └── package.json
│   └── web/                    ← Next.js frontend
│       ├── src/
│       │   ├── app/            ← Next.js pages
│       │   ├── components/     ← UI components
│       │   ├── lib/            ← API client
│       │   └── store/          ← Auth state (Zustand)
│       └── package.json
├── docker-compose.yml
└── package.json
```

---

## 👤 Author

**Rajdeep** — [@Nova6278](https://github.com/Nova6278)
