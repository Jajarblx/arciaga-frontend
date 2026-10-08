# Arciaga Inventory Studio

React and Vite frontend with a responsive glassmorphism design. Connects to the LavaLust API for login, logout, and product CRUD. No mock database or direct MySQL connection is used.

## Start

In the frontend folder:

```bat
copy .env.example .env
npm ci
npm run dev
```

Use `cp` instead of `copy` on macOS/Linux. Keep the backend running. Default frontend URL is http://localhost:5173. Set `VITE_API_URL` in `.env` to your backend URL including `/api`; restart Vite after changing it.

## Check and build

```bat
npm run lint
npm run build
npm run preview
```

Node must meet the `>=22.12.0` package engine requirement. The original starter dependency versions and package lock are retained.

Before building, copy `.env.example` to `.env` for local testing, or set a real `VITE_API_URL` in your hosting environment. The build checks URL format, requires `/api`, and rejects localhost for Render deployments. `.github/workflows/check.yml` runs lint/build checks on GitHub.

## Deploy on Render

Create a Static Site connected to this frontend repository. Build: `npm ci && npm run build`. Publish directory: `dist`. Add `VITE_API_URL=https://YOUR-BACKEND.onrender.com/api` before building. Set the backend's `FRONTEND_URL` to this site's exact origin. See the parent `START_HERE.md` for the complete guide.

## Files to study

- `src/App.jsx`: session restoration, dashboard, stock filters, search, sorting and pagination.
- `src/components/Login.jsx`: login form and password visibility control.
- `src/components/ProductForm.jsx`: product create/edit form and field errors.
- `src/components/Modal.jsx`: native dialog, keyboard focus handling and escape behavior.
- `src/lib/api.js`: HTTP requests, token persistence, single-flight refresh and errors.
- `src/index.css`, `src/App.css`: frosted glass styles and responsive layouts.

Prices use PHP (Philippine pesos). Low stock is 1–10 units; out of stock is zero. These are interface conventions, not additional database fields.
