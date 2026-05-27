// Dev: Vite → backend /api/football. Production: Vercel serverless or VITE_API_BASE_URL backend.
const apiRoot = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || ""
const PREFIX = apiRoot ? `${apiRoot}/api/football` : "/api/football"

/**
 * @param {Response} res
 * @param {string} fallback
 */
async function footballApiError(res, fallback) {
  const text = await res.text().catch(() => "")
  try {
    const data = JSON.parse(text)
    const tokenErr = data?.errors?.token
    if (tokenErr) {
      return `API key problem: ${tokenErr} Add API_FOOTBALL_KEY to backend/.env.local (local) or Vercel env, then restart the server.`
    }
    if (data?.error && typeof data.error === "string") return data.error
  } catch {
    /* not JSON */
  }
  if (res.status === 403) {
    return "Football API denied the request (403). Check API_FOOTBALL_KEY in backend/.env.local or Vercel."
  }
  if (res.status === 503) {
    try {
      const data = JSON.parse(text)
      if (data?.error) return String(data.error)
    } catch {
      /* ignore */
    }
  }
  return text ? `Football API ${res.status}: ${text.slice(0, 160)}` : fallback
}

/**
 * @param {string} path e.g. "/fixtures"
 * @param {Record<string, string | number | undefined>} [params]
 * @returns {Promise<{ response?: unknown[] }>}
 */
export async function fetchFootballApi(path, params = {}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") qs.set(key, String(value))
  }
  const query = qs.toString()
  const url = `${PREFIX}${path}${query ? `?${query}` : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const msg = await footballApiError(res, `Football API ${res.status}`)
    throw new Error(msg)
  }
  return res.json()
}

/**
 * @param {Record<string, string | number | undefined>} params
 * @returns {Promise<{ response?: unknown[] }>}
 */
export async function fetchFixtures(params) {
  return fetchFootballApi("/fixtures", params)
}

/** @param {number} fixtureId */
export function fetchFixtureEvents(fixtureId) {
  return fetchFootballApi("/fixtures/events", { fixture: fixtureId })
}

/** @param {number} fixtureId */
export function fetchFixtureLineups(fixtureId) {
  return fetchFootballApi("/fixtures/lineups", { fixture: fixtureId })
}
