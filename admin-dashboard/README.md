# FarmDirect Admin Dashboard

Standalone Next.js admin app for FarmDirect.

## Run independently

```bash
npm --prefix admin-dashboard run dev
```

Runs on `http://localhost:3001`.

## Environment setup

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_BASE_URL`: Shared backend API (for example `http://localhost:5000/api`)
- `NEXT_PUBLIC_MAIN_APP_URL`: Main storefront URL (for example `http://localhost:3000`)
- `NEXT_PUBLIC_USE_MOCK_API`: Set `true` only for local UI-only mock mode

## Monorepo commands

From repo root:

- `npm run dev:admin` starts only the admin app
- `npm run dev:all` starts backend + storefront + admin app
- `npm run start:admin` starts admin app in production mode
- `npm run start:all` starts all apps in production mode

## Integration notes

- Admin login uses the shared backend `/api/login` endpoint.
- Admin API calls use `NEXT_PUBLIC_API_BASE_URL`.
- The storefront links to this app using `NEXT_PUBLIC_ADMIN_PORTAL_URL`.
- Backend CORS should include both app URLs using `CORS_ORIGINS`.
