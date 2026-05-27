import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const appDir = path.dirname(fileURLToPath(import.meta.url))

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
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api/matches": { target: apiProxy, changeOrigin: true },
        "/api/standings": { target: apiProxy, changeOrigin: true },
        "/api/health": { target: apiProxy, changeOrigin: true },
        "/api/football": footballProxy,
      },
    },
  }
})
