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
- **ESPN live data:** no env keys — always `/api/espn` on this frontend deployment.
- **Predictions (MongoDB):** `VITE_API_BASE_URL` = `https://your-backend.vercel.app` (does not affect ESPN).
- **Optional:** `API_FOOTBALL_KEY`, `API_FOOTBALL_MODE` on this frontend project if using API-Football.
