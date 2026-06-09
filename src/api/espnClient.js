// Dev: Vite → /api/espn proxy. Production: Vercel serverless.
const apiRoot = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || ""
const PREFIX = apiRoot ? `${apiRoot}/api/espn` : "/api/espn"

const SCOREBOARD_PATHS = {
  worldcup: "/sports/soccer/fifa.world/scoreboard",
  all: "/sports/soccer/all/scoreboard",
}

const SUMMARY_PATHS = {
  worldcup: "/sports/soccer/fifa.world/summary",
  all: "/sports/soccer/all/summary",
}

/**
 * @param {Response} res
 * @param {string} fallback
 */
async function espnApiError(res, fallback) {
  const text = await res.text().catch(() => "")
  try {
    const data = JSON.parse(text)
    if (data?.error && typeof data.error === "string") return data.error
  } catch {
    /* not JSON */
  }
  return text ? `ESPN API ${res.status}: ${text.slice(0, 160)}` : fallback
}

/**
 * @param {string} path e.g. "/sports/soccer/fifa.world/scoreboard"
 * @param {Record<string, string | number | undefined>} [params]
 */
export async function fetchEspnApi(path, params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") qs.set(key, String(value))
  }
  const query = qs.toString()
  const url = `${PREFIX}${path}${query ? `?${query}` : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const msg = await espnApiError(res, `ESPN API ${res.status}`)
    throw new Error(msg)
  }
  return res.json()
}

/** @param {Record<string, string | number | undefined>} [params] */
export function fetchEspnScoreboard(params = {}) {
  return fetchEspnApi(SCOREBOARD_PATHS.worldcup, params)
}

/**
 * @param {number | string} eventId
 * @param {"worldcup" | "all"} [scope]
 */
export function fetchEspnSummary(eventId, scope = "worldcup") {
  return fetchEspnApi(SUMMARY_PATHS[scope], { event: eventId })
}
