/**
 * Vercel ESPN proxy — flat handler (nested api/espn/[...path].js is unreliable on Vercel).
 * Rewritten from /api/espn/* via vercel.json → ?path=...
 */
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2"

/**
 * @param {import("@vercel/node").VercelRequest} req
 */
function resolveUpstreamPath(req) {
  const pathParam = req.query.path
  if (pathParam != null && pathParam !== "") {
    const segments = Array.isArray(pathParam) ? pathParam : String(pathParam).split("/")
    return `/${segments.filter(Boolean).join("/")}`
  }

  const host = req.headers.host || "localhost"
  const full = new URL(req.url || "/", `https://${host}`)
  const fromUrl = full.pathname.replace(/^\/api\/espn(-proxy)?/, "") || "/"
  return fromUrl.startsWith("/") ? fromUrl : `/${fromUrl}`
}

/**
 * @param {import("@vercel/node").VercelRequest} req
 */
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

  const upstreamPath = resolveUpstreamPath(req)
  const targetUrl = ESPN_BASE + upstreamPath + buildQueryString(req)

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: { Accept: "application/json" },
    redirect: "follow",
  })

  const ct = upstream.headers.get("content-type") || "application/json"
  const body = Buffer.from(await upstream.arrayBuffer())
  res.status(upstream.status).setHeader("Content-Type", ct).send(body)
}
