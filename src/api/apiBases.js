/**
 * API base URLs — keep ESPN on the frontend deployment; predictions on MongoDB backend.
 */

/** Same-origin ESPN proxy (Vercel serverless or Vite dev proxy). Never the MongoDB backend. */
export const ESPN_PREFIX = "/api/espn"

/** Same-origin API-Football proxy when used. */
export const FOOTBALL_PREFIX = "/api/football"

/**
 * MongoDB / predictions backend (Vercel backend project).
 * Local dev: leave unset — Vite proxies /api/matches and /api/standings to VITE_API_PROXY.
 */
export function predictionsApiBase() {
  const root = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || ""
  return root ? `${root}/api` : "/api"
}
