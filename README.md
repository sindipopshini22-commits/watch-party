# Watch Party

A full-stack watch-party web app with synchronized playback, live video chat, and social sharing.
live deployed<<<<< https://watchplaysindi.netlify.app/

## Screenshots

The frontend ships with a dark cinematic UI:

```md
![Home hero with featured poster and carousels](./docs/home-hero.png)
![Watch-party room with player, chat, and video call](./docs/room.png)
```

![Tech stack badge](https://img.shields.io/badge/TypeScript-2E68B4?logo=typescript&logoColor=white)
![Next.js badge](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)
![LiveKit badge](https://img.shields.io/badge/LiveKit-2563EB?logo=livekit&logoColor=white)
![Prisma badge](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Tailwind badge](https://img.shields.io/badge/Tailwind_CSS-0EA5E9?logo=tailwindcss&logoColor=white)
![Docker badge](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Socket.io badge](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white)

| Feature | Stack |
| --- | --- |
| Frontend | Next.js 14 App Router, Tailwind, Lucide |
| Backend | Express + Socket.io |
| Database | SQLite via Prisma |
| Realtime | Socket.io |
| Video chat | LiveKit |
| Caching | Redis (optional) |

## Prerequisites

- Node.js 18+
- npm 8+
- Docker and Docker Compose

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/sindipopshini22-commits/watch-party.git
cd watch-party

# 2. Start infrastructure and backend
docker compose up -d
npm install
npm run dev

# 3. In another shell, start the frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

Backend supports these runtime env vars:

```env
DATABASE_URL=file:./dev.db
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
REDIS_URL=redis://localhost:6379
PORT=4000
```

Frontend supports these runtime env vars:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
```

## Project Structure

```text
watch-party/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/
│       │   ├── movies.ts
│       │   ├── livekit.ts
│       │   └── aiAssistant.ts
│       ├── sockets/
│       │   └── roomHandler.ts
│       ├── redisClient.ts
│       ├── server.ts
│       └── scripts/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   └── room/[roomId]/page.tsx
│   │   └── components/
│   │       ├── NavBar.tsx
│   │       ├── UniversalPlayer.tsx
│   │       ├── ChatSidebar.tsx
│   │       ├── LiveKitChat.tsx
│   │       ├── InvitePanel.tsx
│   │       ├── DanmakuOverlay.tsx
│   │       ├── MoodMeter.tsx
│   │       ├── MovieRoulette.tsx
│   │       └── TicTacToeGame.tsx
│   ├── package.json
│   └── ...
├── docker-compose.yml
├── livekit.yaml
├── package.json
└── README.md
```

## Backend

- REST API for movies, rooms, seasons, episodes
- Socket.io realtime events for chat, reactions, sync
- Prisma with SQLite
- LiveKit JWT endpoint
- AI assistant endpoint stub

## Frontend

- Catalog with hero banner and horizontal movie rows
- Room page with player, episode selector, chat sidebar
- Live video conference via LiveKit
- Share/invite panel
- Mini-games and reactions

## Scripts

```bash
# Root
npm run dev
npm run install:all

# Backend
npm run dev --workspace=backend
npm run db:seed --workspace=backend

# Frontend
npm run dev --workspace=frontend
```

## Docker

```bash
docker compose up -d
```

Starts:
- app backend API and Socket.io server
- LiveKit server
- Redis
- PostgreSQL when needed

## Known Limits

- Playback depends on available stream URLs in the seed data
- Some Archive.org URLs may fail; replace `source_id` values with stable MP4s or YouTube IDs
- Redis is optional; chat and sync fall back to in-memory when Redis is unreachable
- Frontend video autoplay requires explicit user interaction per browser policy
