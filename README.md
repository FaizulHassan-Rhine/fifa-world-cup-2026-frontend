# Frontend (Vite + React)

## Setup

```bash
npm install
cp .env.example .env.local
```

## Dev

```bash
npm run dev
```

Requires the backend running at `http://localhost:3001` (or set `VITE_API_PROXY` in `.env.local`).

## Vercel deploy

- **Root Directory:** `frontend` (if repo root is parent) or connect this folder as the project root
- **Build:** `npm run build`
- **Output:** `dist`
- **Env (ESPN live data needs no keys):** leave `VITE_API_BASE_URL` unset so `/api/espn` runs on this project.
- **Optional:** `API_FOOTBALL_KEY`, `API_FOOTBALL_MODE` (`apisports` or `rapidapi`) if using API-Football.
- **Predictions only:** `VITE_API_BASE_URL` = `https://your-backend.vercel.app`
