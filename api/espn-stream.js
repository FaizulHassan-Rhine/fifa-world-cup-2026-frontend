/**
 * Server-Sent Events — ESPN scoreboard push every 5s.
 * ?scope=all → global football; default → FIFA World Cup.
 */
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2"

const SCOREBOARD_PATHS = {
  worldcup: `${ESPN_BASE}/sports/soccer/fifa.world/scoreboard`,
  all: `${ESPN_BASE}/sports/soccer/all/scoreboard`,
}

const POLL_MS = 5_000

/**
 * @param {Date} date
 */
function espnDateParam(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

/**
 * @param {unknown[]} lists
 */
function mergeEvents(lists) {
  /** @type {unknown[]} */
  const merged = []
  const seen = new Set()
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const event of list) {
      const id =
        event && typeof event === "object"
          ? /** @type {{ id?: string | number }} */ (event).id
          : null
      const key = id != null ? String(id) : JSON.stringify(event)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(event)
    }
  }
  return merged
}

/**
 * @param {"worldcup" | "all"} scope
 */
async function fetchScoreboard(scope) {
  if (scope === "all") {
    const now = new Date()
    const dates = [-1, 0, 1].map((offset) => {
      const d = new Date(now)
      d.setDate(d.getDate() + offset)
      return espnDateParam(d)
    })
    const lists = await Promise.all(
      dates.map(async (date) => {
        const res = await fetch(`${SCOREBOARD_PATHS.all}?dates=${date}`, {
          headers: { Accept: "application/json" },
        })
        const json = await res.json()
        return /** @type {unknown[]} */ (json?.events ?? [])
      }),
    )
    return { events: mergeEvents(lists) }
  }

  const res = await fetch(SCOREBOARD_PATHS.worldcup, {
    headers: { Accept: "application/json" },
  })
  return res.json()
}

/** @param {import("@vercel/node").VercelRequest} req @param {import("@vercel/node").VercelResponse} res */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).setHeader("Allow", "GET").end("Method Not Allowed")
    return
  }

  const scope = req.query.scope === "all" ? "all" : "worldcup"

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  })

  let closed = false
  /** @type {NodeJS.Timeout | undefined} */
  let timer

  const cleanup = () => {
    closed = true
    if (timer) clearInterval(timer)
  }

  req.on("close", cleanup)

  async function push() {
    if (closed) return
    try {
      const json = await fetchScoreboard(scope)
      res.write(`data: ${JSON.stringify(json)}\n\n`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "stream error"
      res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`)
    }
  }

  await push()
  timer = setInterval(() => {
    void push()
  }, POLL_MS)
}
