# FarmDirect Monorepo

FarmDirect is a local farm produce platform split into three apps:

- a customer storefront for browsing and buying produce
- an admin dashboard for managing orders, products, CRM, and reports
- a backend API for local data, uploads, and shared business logic

## Project Layout

- `frontend` - storefront built with Next.js
- `admin-dashboard` - standalone admin portal built with Next.js
- `backend` - Express API with local storage and upload support

## What You Can Do

- browse products and place orders in the storefront
- manage products, orders, customers, and reporting in the admin portal
- upload local product images and serve them from the backend
- run the whole project as a monorepo or start each app separately

## Requirements

- Node.js 18 or newer
- npm
- a browser for the storefront and admin UI

## Install

From the repo root:

```bash
npm install
```

If you want to install app dependencies separately:

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix admin-dashboard install
```

## Run The Apps

Start the storefront + backend:

```bash
npm run dev
```

Start the admin portal:

```bash
npm run dev:admin
```

Start everything together:

```bash
npm run dev:all
```

Production-style starts use the matching `start` scripts:

```bash
npm run start
npm run start:admin
npm run start:all
```

## Default URLs

- Storefront: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Admin portal: `http://localhost:3001`

## Environment Variables

The apps can run with local fallbacks, but these environment variables are used when you want to connect real services:

- `NEXT_PUBLIC_API_BASE_URL` - backend API base URL for the storefront and admin app
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_ADMIN_PORTAL_URL` - link target for the storefront admin button
- `CORS_ORIGINS` - comma-separated list of allowed frontend origins for the backend

Example backend origin setup:

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Local Images

Uploaded or imported images are served from the backend under `/uploads`.

- product image uploads return a public URL
- the storefront can use that URL directly
- imported demo images were copied from the workspace `New folder`

## Admin Demo Access

The admin portal includes built-in demo credentials for local development:

- email: `admin@farmdirect.com`
- password: `admin123`

Other demo roles also exist for warehouse, finance, and driver views.

## Helpful Notes

- The backend uses a local in-memory store for development data.
- The admin dashboard falls back to local sample data when remote data is unavailable.
- If you only want one app, use the `dev:backend`, `dev:frontend`, or `start:admin` scripts.

## Troubleshooting

- If port `3000` is already in use, the storefront may move to another port.
- If the admin portal shows empty data, make sure the backend is running and the local demo data has loaded.
- If image URLs do not load, confirm the backend is running and serving `/uploads`.
