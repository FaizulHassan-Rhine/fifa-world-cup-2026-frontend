/**
 * Vercel serverless proxy for the public ESPN JSON API (no API key required).
 */
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2"

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("Allow", "GET, HEAD").end("Method Not Allowed")
    return
  }

  const host = req.headers.host || "localhost"
  const full = new URL(req.url || "/", `https://${host}`)
  const upstreamPath = full.pathname.replace(/^\/api\/espn/, "") || "/"
  const targetUrl = ESPN_BASE + upstreamPath + full.search

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: { Accept: "application/json" },
    redirect: "follow",
  })

  const ct = upstream.headers.get("content-type") || "application/json"
  const body = Buffer.from(await upstream.arrayBuffer())
  res.status(upstream.status).setHeader("Content-Type", ct).send(body)
}
