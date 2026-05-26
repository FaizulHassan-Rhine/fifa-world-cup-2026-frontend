/**
 * Vercel serverless proxy for API-Football — mirrors `vite.config.js` dev proxy.
 * Set `API_FOOTBALL_KEY` and optional `API_FOOTBALL_MODE` in the Vercel project env.
 */
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

  const host = req.headers.host || "localhost"
  const full = new URL(req.url || "/", `https://${host}`)
  let upstreamPath = full.pathname.replace(/^\/api\/football/, "") || "/"

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

  const targetUrl = targetBase + upstreamPath + full.search

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
