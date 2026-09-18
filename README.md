# RouteHub

Multi-sided **delivery / logistics platform** for sellers, riders, customers, and platform admins.

Sellers create delivery jobs → riders accept and fulfill → customers track status (with OTP confirmation) → platform admins manage users and operations.

**Local-first:** runs on **SQLite** by default — no Postgres install required to try the app.

## Highlights

- **Four portals** in one Next.js app: platform admin, seller, rider, customer
- **SQLite for local dev** via Prisma + `better-sqlite3` (`file:./prisma/dev.db`)
- **Domain model:** users, sellers, riders, deliveries, addresses, devices/FCM, role assignments
- **Auth & push:** Firebase Auth + Firebase Admin + FCM
- **Maps:** Google Maps pickup / dropoff
- **Mobile companion:** Flutter rider app under `mobile_app/`

## Architecture

```
Browser portals (Next.js App Router)
  ├── /platform-admin
  ├── /seller
  ├── /rider
  └── /customer + public tracking
        │
        ▼
  API routes + server logic
        │
        ├── Prisma → SQLite (local)  [DATABASE_URL=file:./prisma/dev.db]
        ├── Firebase Auth / Admin / FCM
        └── Google Maps

Flutter rider app (mobile_app/)
  └── same backend + Firebase
```

### Data model (core)

| Model | Role |
|-------|------|
| `User` | Auth identity (email/phone), devices |
| `Seller` / `Rider` / `Customer` | Business roles |
| `Delivery` | Order lifecycle: `PENDING` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED` |
| `Address` | Pickup / dropoff locations with lat/lng |
| `RiderPayout` | Rider earnings periods |
| `File` / `RiderFile` | Uploaded docs (license, ID, photos) |

See `prisma/schema.prisma` for the full schema.

## Tech stack

| Layer | Choice |
|-------|--------|
| Web | Next.js 16, React 19, TypeScript, Tailwind |
| ORM / DB (local) | Prisma 7 + **SQLite** (`better-sqlite3` adapter) |
| Auth / push | Firebase Auth + Admin + FCM |
| Maps | Google Maps JavaScript API |
| Mobile | Flutter (Riverpod) |
| Package manager | pnpm |

## Prerequisites

| Tool | Notes |
|------|-------|
| Node.js 20+ | 22+ recommended |
| pnpm | `npm install -g pnpm` |
| Firebase project | Free Spark plan is enough for local auth |
| Google Maps API key | Places / Maps JavaScript (optional until you open map screens) |
| Flutter (optional) | Only if you run `mobile_app/` |

No PostgreSQL or Docker required for the default local setup.

## Quick start (web + SQLite)

```bash
git clone https://github.com/nshorna/routehub.git
cd routehub

cp env.sample .env.local
# Prisma CLI also reads .env.local (see prisma.config.ts)
# 1) Leave DATABASE_URL as file:./prisma/dev.db
# 2) Fill FIREBASE_SERVICE_ACCOUNT (one-line JSON)
# 3) Fill NEXT_PUBLIC_FIREBASE_* from your Firebase web app
# 4) Optionally set NEXT_PUBLIC_GOOGLE_MAP_API_KEY

pnpm setup          # install deps + prisma generate + db push
pnpm dev            # http://localhost:3011
```

Equivalent step-by-step:

```bash
pnpm install
pnpm db:setup       # creates prisma/dev.db from schema
pnpm dev
```

### Create a platform admin

```bash
# Loads FIREBASE_SERVICE_ACCOUNT from the environment / .env via dotenv
pnpm create-platform-user admin@example.com 'strong-password' OWNER
```

Then open:

| URL | Portal |
|-----|--------|
| http://localhost:3011 | Landing |
| http://localhost:3011/platform-admin | Platform admin |
| http://localhost:3011/seller | Seller |
| http://localhost:3011/rider | Rider (web) |
| http://localhost:3011/customer | Customer |

## Environment

Copy `env.sample` → `.env.local`.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Default `file:./prisma/dev.db` (SQLite) |
| `FIREBASE_SERVICE_ACCOUNT` | Admin SDK JSON (single line) |
| `NEXT_PUBLIC_FIREBASE_*` | Client Firebase config |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Optional web push |
| `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` | Maps |
| `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` | Usually `http://localhost:3011` |

Never commit `.env*`, service account JSON, keystores, or `google-services.json`.

`prisma/dev.db` is gitignored — each clone creates its own local database.

## Project layout

```
app/                 # App Router: landing, portals, API routes
components/          # admin / seller / rider / customer / shared UI
lib/                 # prisma, firebase, auth, notifications
prisma/              # schema + local SQLite file (dev.db)
mobile_app/          # Flutter rider client
scripts/             # platform user + FCM utilities
env.sample           # safe template
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm setup` | `pnpm install` + generate client + push SQLite schema |
| `pnpm dev` | Dev server on **3011** |
| `pnpm build` / `pnpm start` | Production build / start |
| `pnpm db:setup` | `prisma generate` + `db push` |
| `pnpm db:studio` | Browse SQLite data in Prisma Studio |
| `pnpm db:push` | Push schema changes to `dev.db` |
| `pnpm create-platform-user` | Create Firebase + platform admin user |
| `pnpm lint` | ESLint |

## Flutter rider app (optional)

```bash
cd mobile_app
cp android/app/google-services.json.sample android/app/google-services.json
# Replace with a real Firebase Android config
flutter pub get
flutter run
```

Signing: see `android/key.properties.sample` (do not commit real keystores).

## Production notes

- Local default is SQLite for easy demos and portfolio clones.
- For multi-user production traffic, switch the Prisma datasource to PostgreSQL (or similar), point `DATABASE_URL` at that server, and use a matching Prisma driver adapter — the domain model in `schema.prisma` is the same.
- Put Firebase and Maps keys only in host env / secrets manager.
- Serve the Next app behind a reverse proxy with HTTPS.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `DATABASE_URL is not set` | Copy `env.sample` → `.env.local` |
| Prisma client missing | Run `pnpm db:generate` or `pnpm db:setup` |
| Firebase Admin init failed | Ensure `FIREBASE_SERVICE_ACCOUNT` is valid one-line JSON |
| Phone auth fails | Enable Phone provider in Firebase console; add localhost to authorized domains |
| Maps blank | Set `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` and enable Maps JS API |
| `better-sqlite3` build errors | Use Node 20+, retry `pnpm install` (native module) |

## License

MIT — see [LICENSE](./LICENSE).
