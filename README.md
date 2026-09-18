# RouteHub

Multi-sided **delivery / logistics platform** for sellers, riders, customers, and platform admins.

Built with **Next.js**, **TypeScript**, **Prisma + PostgreSQL**, **Firebase Auth**, Google Maps, and a companion **Flutter** rider app.

Sellers create delivery jobs → riders accept and fulfill → customers track status with OTP confirmation → platform admins manage users and operations.

## Highlights

- **Four portals:** platform admin, seller, rider, and customer experiences in one Next.js app
- **Domain model:** users, sellers, riders, deliveries, addresses, devices/FCM tokens, role assignments (`prisma/schema.prisma`)
- **Realtime-ish ops:** Firebase Auth (phone/email), push notifications, map-based pickup/dropoff
- **Mobile companion:** Flutter rider app under `mobile_app/`
- **Stack:** Next.js App Router, React, Prisma, PostgreSQL, Firebase Admin/Client

## Architecture (short)

```
Customer / Seller / Rider / Admin (Next.js UI)
  → API routes + server actions
  → Prisma → PostgreSQL
  → Firebase Auth + FCM
  → Google Maps (pickup / dropoff)

Rider mobile (Flutter)
  → same backend APIs + Firebase
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Web app | Next.js 16, React 19, TypeScript, Tailwind |
| Database | PostgreSQL + Prisma 7 |
| Auth / push | Firebase Auth + Admin + FCM |
| Maps | Google Maps JavaScript API |
| Mobile | Flutter (Riverpod) |
| Package manager | pnpm |

## Quick start

```bash
git clone https://github.com/nshorna/routehub.git
cd routehub
pnpm install

cp env.sample .env.local
# Fill DATABASE_URL, FIREBASE_SERVICE_ACCOUNT, NEXT_PUBLIC_FIREBASE_*, maps key

pnpm db:generate
pnpm db:push
pnpm dev   # http://localhost:3011
```

### Flutter rider app

```bash
cd mobile_app
# Add android/app/google-services.json from Firebase (see google-services.json.sample)
flutter pub get
flutter run
```

## Environment

See `env.sample`. Never commit real `.env` files, service account JSON, keystores, or `google-services.json`.

Required:

1. PostgreSQL connection (`DATABASE_URL` / `DB_*`)
2. Firebase Admin JSON (`FIREBASE_SERVICE_ACCOUNT`)
3. Firebase web config (`NEXT_PUBLIC_FIREBASE_*`)
4. Google Maps browser key (`NEXT_PUBLIC_GOOGLE_MAP_API_KEY`)

Optional scripts:

```bash
pnpm create-platform-user admin@example.com 'strong-password' OWNER
```

## Project layout

```
app/                 # Next.js App Router (landing + role portals + API)
components/          # UI for admin, seller, rider, customer, shared
lib/                 # Prisma, Firebase, auth, notifications
prisma/              # Schema
mobile_app/          # Flutter rider client
scripts/             # Platform user / FCM maintenance utilities
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server on port 3011 |
| `pnpm build` / `pnpm start` | Production |
| `pnpm db:generate` | Prisma client |
| `pnpm db:push` | Push schema |
| `pnpm lint` | ESLint |

## License

MIT — see [LICENSE](./LICENSE).
