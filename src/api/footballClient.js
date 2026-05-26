// Proxied to upstream /fixtures (api-sports: host is already v3.* — no /v3 path segment).
const PREFIX = "/api/football"

/**
 * @param {Record<string, string | number | undefined>} params
 * @returns {Promise<{ response?: unknown[] }>}
 */
export async function fetchFixtures(params) {
  const qs = new URLSearchParams()
  if (params.live != null) qs.set("live", String(params.live))
  if (params.date) qs.set("date", params.date)
  if (params.league != null) qs.set("league", String(params.league))
  if (params.season != null) qs.set("season", String(params.season))
  if (params.from) qs.set("from", params.from)
  if (params.to) qs.set("to", params.to)
  if (params.timezone) qs.set("timezone", params.timezone)

  const url = `${PREFIX}/fixtures?${qs}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(
      text ? `Football API ${res.status}: ${text.slice(0, 200)}` : `Football API ${res.status}`,
    )
  }
  return res.json()
}
