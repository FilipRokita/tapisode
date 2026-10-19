<div align="center">
  <h1>Tapisode: movies & shows tracker</h1>
  <p><strong>Fast, phone-first minimalist tracker for movies and TV shows.</strong></p>
</div>

<br>

<div align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL_17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 17">
  <img src="https://img.shields.io/badge/Drizzle_ORM-1C1C1C?logo=drizzle&logoColor=C5F74F" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Better_Auth-000000?logo=betterauth&logoColor=white" alt="Better Auth">
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white" alt="Zod">
  <img src="https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest">
</div>

---

**Tapisode** is a fast, phone-first minimalist tracker for movies and TV shows.
Keep tabs on what you are watching without social feeds, ratings, or unnecessary
noise.

Tap `+1 Episode` directly on your active shows to advance your progress
instantly. Check where a title is currently streaming (Netflix, Max, Disney+,
Prime Video, and others) across regions without juggling multiple guides.

Dark by default, built phone-first, and fully responsive on desktop.

## 📖 Table of contents

- [✨ What it does](#-what-it-does)
- [🧱 Stack](#-stack)
- [🔧 How it's built](#-how-its-built)
- [🚀 Run it locally](#-run-it-locally)
- [☁️ Run it on a host](#️-run-it-on-a-host)
- [📚 Documentation](#-documentation)

## ✨ What it does

1. **One-tap episode progress.** Advance active shows with a thumb-friendly `+1 Episode`
   button backed by optimistic UI.
2. **Track streaming availability.** See active streaming platforms (Netflix,
   Max, Disney+, SkyShowtime, Prime Video) for your region and catch licensing
   rotations.
3. **No bloat.** No reviews, no social feeds, and no algorithmic recommendations.
   Just a clean, fast personal watchlist.
4. **Bottom drawer details.** Tap any title for a lightweight drawer with synopsis,
   episode picker, and streaming badges.
5. **Responsive desktop layout.** Expands into a multi-column poster grid with hover
   actions and streaming service filters.

## 🧱 Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16 (App Router), Tailwind CSS, shadcn/ui (Radix, Vaul) |
| Backend | Next.js Server Actions + Route Handlers |
| Database | PostgreSQL 17 (Neon Serverless with connection pooling) |
| ORM | Drizzle ORM |
| Auth | Better Auth (clean Drizzle integration) |
| Validation | Zod |
| Testing | Vitest |
| External APIs | TMDB via hexagonal Media Provider adapter |
| Dev environment | Dev Container (VS Code) |

## 🔧 How it's built

Not a feature list. Each line is an architectural principle you can verify in
the codebase.

| Claim | Proof |
| :--- | :--- |
| **Provider-agnostic domain (Hexagonal architecture)** | Core business logic and database tables never bind directly to TMDB or third parties. An abstract `MediaProviderService` interface defines ports, implemented by `TmdbAdapter`. [src/domain/](src/domain/) |
| **Every action authorizes itself** | Server Actions verify the session, validate input with Zod, and ensure user ownership before any mutation. [src/actions/](src/actions/) |
| **Fast optimistic progress updates** | Episode increments update the interface instantly via `useOptimistic`, syncing in the background with rollbacks on failure. [src/components/](src/components/) |
| **Vendor-neutral data model** | The `user_media` table stores generic `provider` and `externalId` keys, with an optional `imdbId` bridge to prevent lock-in. [src/db/schema.ts](src/db/schema.ts) |
| **Mobile-first, desktop-ready** | Bottom navigation and thumb-friendly drawers on phones; multi-column grid and filter sidebars on desktop. [src/components/](src/components/) |

## 🚀 Run it locally

Everything runs inside the dev container; nothing needs to be installed on your
host machine.

1. **Create the environment file.** It is gitignored:

   ```bash
   cp .env.example .env
   ```

   Fill in the required values (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `TMDB_API_KEY`).

2. **Open the repository in the container.** In VS Code, run *Dev Containers: Reopen in
   Container*.

3. **Install dependencies and run migrations:**

   ```bash
   npm install
   npm run db:migrate
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## ☁️ Run it on a host

The same application and code. Only environment variables differ.

1. **Database:** Set up a PostgreSQL 17 instance (such as Neon Serverless with pooling).
2. **Deploy:** Deploy to Vercel or any container runtime.
3. **Set environment variables:**

   | Variable | Description |
   | :--- | :--- |
   | `DATABASE_URL` | Pooled PostgreSQL connection string for queries |
   | `DIRECT_URL` | Direct connection string for Drizzle migrations |
   | `BETTER_AUTH_SECRET` | Secret key for auth tokens (`openssl rand -base64 32`) |
   | `BETTER_AUTH_URL` | Public production URL of the app |
   | `TMDB_API_KEY` | TMDB API key or read access token |

4. **Migrations:** Run migrations as part of the build step: `npm run db:migrate`.

## 📚 Documentation

Anything that is not in this file lives in [`docs/`](docs/).
