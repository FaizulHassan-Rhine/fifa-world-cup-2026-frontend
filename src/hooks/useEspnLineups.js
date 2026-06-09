import { useEffect, useRef, useState } from "react"
import { fetchEspnSummary } from "../api/espnClient.js"
import { normalizeEspnCommentary } from "../utils/normalizeEspnCommentary.js"
import { normalizeEspnKeyEvents } from "../utils/normalizeEspnKeyEvents.js"
import { normalizeEspnBoxscoreStats } from "../utils/normalizeEspnMatchStats.js"
import { normalizeEspnRostersToLineups } from "../utils/normalizeEspnLineups.js"

const CONCURRENCY = 5

/**
 * @param {number[]} ids
 * @param {number} limit
 */
function capIds(ids, limit) {
  const out = []
  const seen = new Set()
  for (const id of ids) {
    if (id == null || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= limit) break
  }
  return out
}

/**
 * @param {number[]} eventIds
 * @param {(id: number) => Promise<void>} worker
 */
async function runPool(eventIds, worker) {
  let index = 0
  async function run() {
    while (index < eventIds.length) {
      const id = eventIds[index++]
      await worker(id)
    }
  }
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, eventIds.length) },
    () => run(),
  )
  await Promise.all(workers)
}

/**
 * @param {{ eventIds: number[], scope?: "worldcup" | "all", enabled?: boolean, limit?: number }} opts
 */
export function useEspnLineups(opts) {
  const {
    eventIds,
    scope = "worldcup",
    enabled = true,
    limit = 32,
  } = opts
  const idsKey = eventIds.join(",")
  const [lineups, setLineups] = useState(
    /** @type {Map<number, unknown[]>} */ (new Map()),
  )
  const [keyEvents, setKeyEvents] = useState(
    /** @type {Map<number, unknown[]>} */ (new Map()),
  )
  const [stats, setStats] = useState(
    /** @type {Map<number, import("../utils/normalizeEspnMatchStats.js").ReturnType<typeof normalizeEspnBoxscoreStats>>} */ (
      new Map()
    ),
  )
  const [commentary, setCommentary] = useState(
    /** @type {Map<number, import("../utils/normalizeEspnCommentary.js").ReturnType<typeof normalizeEspnCommentary>>} */ (
      new Map()
    ),
  )
  const [loading, setLoading] = useState(false)
  const mounted = useRef(true)
  const cache = useRef(
    /** @type {Map<number, { lineups: unknown[], keyEvents: unknown[], stats: ReturnType<typeof normalizeEspnBoxscoreStats>, commentary: ReturnType<typeof normalizeEspnCommentary> }>} */ (
      new Map()
    ),
  )

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled || eventIds.length === 0) {
      const t = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(t)
    }

    const targets = capIds(eventIds, limit)
    const missing = targets.filter((id) => !cache.current.has(id))
    if (!missing.length) {
      const lu = new Map()
      const ke = new Map()
      const st = new Map()
      const cm = new Map()
      for (const [id, val] of cache.current) {
        lu.set(id, val.lineups)
        ke.set(id, val.keyEvents)
        if (val.stats) st.set(id, val.stats)
        if (val.commentary?.length) cm.set(id, val.commentary)
      }
      setLineups(lu)
      setKeyEvents(ke)
      setStats(st)
      setCommentary(cm)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    void runPool(missing, async (id) => {
      if (cancelled) return
      try {
        const json = await fetchEspnSummary(id, scope)
        const rosterRows = normalizeEspnRostersToLineups(
          /** @type {{ rosters?: unknown }} */ (json).rosters,
          id,
        )
        const homeName =
          /** @type {{ team?: { name?: string }, homeAway?: string }} */ (
            rosterRows.find((r) => r?.homeAway === "home")
          )?.team?.name ?? ""
        const awayName =
          /** @type {{ team?: { name?: string }, homeAway?: string }} */ (
            rosterRows.find((r) => r?.homeAway === "away")
          )?.team?.name ?? ""
        const events = normalizeEspnKeyEvents(
          /** @type {{ keyEvents?: unknown }} */ (json).keyEvents,
          homeName,
          awayName,
        )
        const matchStats = normalizeEspnBoxscoreStats(
          /** @type {{ boxscore?: unknown }} */ (json).boxscore,
        )
        const feed = normalizeEspnCommentary(
          /** @type {{ commentary?: unknown }} */ (json).commentary,
        )
        cache.current.set(id, {
          lineups: rosterRows,
          keyEvents: events,
          stats: matchStats,
          commentary: feed,
        })
        if (!mounted.current || cancelled) return
        const lu = new Map()
        const ke = new Map()
        const st = new Map()
        const cm = new Map()
        for (const [fid, val] of cache.current) {
          lu.set(fid, val.lineups)
          ke.set(fid, val.keyEvents)
          if (val.stats) st.set(fid, val.stats)
          if (val.commentary?.length) cm.set(fid, val.commentary)
        }
        setLineups(lu)
        setKeyEvents(ke)
        setStats(st)
        setCommentary(cm)
      } catch {
        cache.current.set(id, {
          lineups: [],
          keyEvents: [],
          stats: null,
          commentary: [],
        })
      }
    }).finally(() => {
      if (mounted.current && !cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [enabled, idsKey, scope, limit, eventIds.length])

  return { lineups, keyEvents, stats, commentary, loading }
}
