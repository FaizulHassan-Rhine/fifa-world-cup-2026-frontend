/**
 * Vercel API-Football proxy — flat handler (nested catch-all unreliable on Vercel).
 */
/** @param {import("@vercel/node").VercelRequest} req */
function resolveUpstreamPath(req) {
  const pathParam = req.query.path
  if (pathParam != null && pathParam !== "") {
    const segments = Array.isArray(pathParam) ? pathParam : String(pathParam).split("/")
    return `/${segments.filter(Boolean).join("/")}`
  }

  const host = req.headers.host || "localhost"
  const full = new URL(req.url || "/", `https://${host}`)
  const fromUrl = full.pathname.replace(/^\/api\/football(-proxy)?/, "") || "/"
  return fromUrl.startsWith("/") ? fromUrl : `/${fromUrl}`
}

/** @param {import("@vercel/node").VercelRequest} req */
function buildQueryString(req) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path" || value == null) continue
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, String(v))
    } else {
      qs.set(key, String(value))
    }
  }
  const query = qs.toString()
  return query ? `?${query}` : ""
}

/** @param {import("@vercel/node").VercelRequest} req @param {import("@vercel/node").VercelResponse} res */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method Not Allowed")
    return
  }

  const key =
    process.env.API_FOOTBALL_KEY ||
    process.env["api-football-v1-pkey"] ||
    ""
  const provider = (process.env.API_FOOTBALL_MODE || "apisports").toLowerCase()

  let upstreamPath = resolveUpstreamPath(req)

  if (provider === "rapidapi") {
    if (upstreamPath.startsWith("/fixtures")) {
      upstreamPath = "/v3" + upstreamPath
    }
  } else if (upstreamPath.startsWith("/v3")) {
    upstreamPath = upstreamPath.replace(/^\/v3/, "") || "/"
  }

  const targetBase =
    provider === "apisports"
      ? "https://v3.football.api-sports.io"
      : "https://api-football-v1.p.rapidapi.com"

  const targetUrl = targetBase + upstreamPath + buildQueryString(req)

  /** @type {Record<string, string>} */
  const headers = {}
  if (provider === "apisports") {
    if (key) headers["x-apisports-key"] = key
  } else {
    if (key) headers["X-RapidAPI-Key"] = key
    headers["X-RapidAPI-Host"] = "api-football-v1.p.rapidapi.com"
  }

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    redirect: "follow",
  })

  const ct = upstream.headers.get("content-type") || "application/json"
  const body = Buffer.from(await upstream.arrayBuffer())
  res.status(upstream.status).setHeader("Content-Type", ct).send(body)
}
