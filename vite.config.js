import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const appDir = path.dirname(fileURLToPath(import.meta.url))

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2"
const ESPN_WORLDCUP = `${ESPN_BASE}/sports/soccer/fifa.world/scoreboard`
const ESPN_ALL = `${ESPN_BASE}/sports/soccer/all/scoreboard`

/**
 * @param {unknown[]} lists
 */
function mergeEspnEvents(lists) {
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

/** Dev-only SSE stream (mirrors api/espn/stream.js on Vercel). */
function espnStreamDevPlugin() {
  return {
    name: "espn-stream-dev",
    configureServer(server) {
      server.middlewares.use("/api/espn/stream", (req, res, next) => {
        if (req.method !== "GET") return next()

        const url = new URL(req.url || "/", "http://localhost")
        const scope = url.searchParams.get("scope") === "all" ? "all" : "worldcup"

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

        async function fetchBoard() {
          if (scope === "all") {
            const now = new Date()
            const dates = [-1, 0, 1].map((offset) => {
              const d = new Date(now)
              d.setDate(d.getDate() + offset)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, "0")
              const day = String(d.getDate()).padStart(2, "0")
              return `${y}${m}${day}`
            })
            const lists = await Promise.all(
              dates.map(async (date) => {
                const upstream = await fetch(`${ESPN_ALL}?dates=${date}`, {
                  headers: { Accept: "application/json" },
                })
                const json = await upstream.json()
                return json?.events ?? []
              }),
            )
            return { events: mergeEspnEvents(lists) }
          }
          const upstream = await fetch(ESPN_WORLDCUP, {
            headers: { Accept: "application/json" },
          })
          return upstream.json()
        }

        async function push() {
          if (closed) return
          try {
            const json = await fetchBoard()
            res.write(`data: ${JSON.stringify(json)}\n\n`)
          } catch (e) {
            const msg = e instanceof Error ? e.message : "stream error"
            res.write(
              `event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`,
            )
          }
        }

        void push()
        timer = setInterval(() => {
          void push()
        }, 5_000)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDir, "")
  const apiProxy = env.VITE_API_PROXY || "http://localhost:3001"
  const apiKey =
    env.API_FOOTBALL_KEY || env["api-football-v1-pkey"] || ""
  const provider = (env.API_FOOTBALL_MODE || "apisports").toLowerCase()

  const footballTarget =
    provider === "apisports"
      ? "https://v3.football.api-sports.io"
      : "https://api-football-v1.p.rapidapi.com"

  /** @type {import("vite").ProxyOptions} */
  const footballProxy = apiKey
    ? {
        target: footballTarget,
        changeOrigin: true,
        rewrite: (proxyPath) => {
          let p = proxyPath.replace(/^\/api\/football/, "")
          if (provider === "rapidapi") {
            if (p.startsWith("/fixtures")) p = "/v3" + p
            return p
          }
          if (p.startsWith("/v3")) p = p.replace(/^\/v3/, "") || "/"
          return p
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            if (provider === "apisports") {
              proxyReq.setHeader("x-apisports-key", apiKey)
            } else {
              proxyReq.setHeader("X-RapidAPI-Key", apiKey)
              proxyReq.setHeader(
                "X-RapidAPI-Host",
                "api-football-v1.p.rapidapi.com",
              )
            }
          })
        },
      }
    : {
        target: apiProxy,
        changeOrigin: true,
      }

  return {
    envDir: appDir,
    plugins: [react(), tailwindcss(), espnStreamDevPlugin()],
    server: {
      proxy: {
        "/api/matches": { target: apiProxy, changeOrigin: true },
        "/api/standings": { target: apiProxy, changeOrigin: true },
        "/api/health": { target: apiProxy, changeOrigin: true },
        "/api/football": footballProxy,
        "/api/espn/sports": {
          target: "https://site.api.espn.com/apis/site/v2",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/espn/, ""),
        },
      },
    },
  }
})
