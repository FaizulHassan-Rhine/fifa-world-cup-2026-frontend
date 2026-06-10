import { useCallback, useEffect, useRef, useState } from "react"
import { DateTime } from "luxon"
import { ESPN_PREFIX } from "../api/apiBases.js"
import {
  buildEspnFixtureIndex,
  buildEspnMatchDetailsMap,
  findLiveEspnMatches,
  normalizeEspnEventList,
} from "../utils/mergeEspnScoreboard.js"
import {
  buildGlobalMatchDetailsMap,
  categorizeGlobalMatches,
  findLiveGlobalMatches,
  mapGlobalEspnMatches,
  mergeEspnEventLists,
} from "../utils/mergeGlobalEspnScoreboard.js"

const POLL_MS = 5_000

const SCOREBOARD_PATHS = {
  worldcup: "/sports/soccer/fifa.world/scoreboard",
  all: "/sports/soccer/all/scoreboard",
}

const espnPrefix = ESPN_PREFIX

/**
 * @param {"worldcup" | "all"} scope
 */
function streamUrlFor(scope) {
  const base = `${ESPN_PREFIX}/stream`
  return scope === "all" ? `${base}?scope=all` : base
}

/**
 * @param {"worldcup" | "all"} scope
 */
async function fetchScoreboardJson(scope) {
  const path = SCOREBOARD_PATHS[scope]
  if (scope === "all") {
    const now = DateTime.now()
    const dates = [-1, 0, 1].map((offset) =>
      now.plus({ days: offset }).toFormat("yyyyLLdd"),
    )
    const jsons = await Promise.all(
      dates.map((date) =>
        fetch(`${espnPrefix}${path}?dates=${date}`).then(async (res) => {
          if (!res.ok) throw new Error(`ESPN API ${res.status}`)
          return res.json()
        }),
      ),
    )
    return { events: mergeEspnEventLists(jsons) }
  }

  const res = await fetch(`${espnPrefix}${path}`)
  if (!res.ok) throw new Error(`ESPN API ${res.status}`)
  return res.json()
}

/**
 * @param {"worldcup" | "all"} scope
 * @param {unknown} json
 */
function applyScoreboard(scope, json, setters, mounted) {
  const list = Array.isArray(json) ? json : normalizeEspnEventList(json)

  if (!mounted.current) return

  setters.setEntries(list)
  setters.setLastUpdated(new Date())
  setters.setHasLoaded(true)

  if (scope === "all") {
    const matches = mapGlobalEspnMatches(list)
    const buckets = categorizeGlobalMatches(matches)
    setters.setGlobalMatches(matches)
    setters.setGlobalBuckets(buckets)
    setters.setLiveMatches(findLiveGlobalMatches(list))
    setters.setMatchDetails(buildGlobalMatchDetailsMap(list))
    setters.setIndex(new Map())
    return
  }

  setters.setGlobalMatches([])
  setters.setGlobalBuckets({ live: [], results: [], upcoming: [] })
  setters.setIndex(buildEspnFixtureIndex(list))
  setters.setLiveMatches(findLiveEspnMatches(list))
  setters.setMatchDetails(buildEspnMatchDetailsMap(list))
}

/**
 * Live scoreboard via SSE push (server polls ESPN) with fetch polling fallback.
 *
 * @param {{ enabled?: boolean, pollIntervalMs?: number, scope?: "worldcup" | "all" }} opts
 */
export function useEspnScoreboardStream(opts = {}) {
  const { enabled = true, pollIntervalMs = POLL_MS, scope = "worldcup" } = opts
  const [index, setIndex] = useState(
    /** @type {ReturnType<typeof buildEspnFixtureIndex>} */ (new Map()),
  )
  const [entries, setEntries] = useState(/** @type {unknown[]} */ ([]))
  const [liveMatches, setLiveMatches] = useState(/** @type {unknown[]} */ ([]))
  const [globalMatches, setGlobalMatches] = useState(
    /** @type {ReturnType<typeof mapGlobalEspnMatches>} */ ([]),
  )
  const [globalBuckets, setGlobalBuckets] = useState(
    /** @type {ReturnType<typeof categorizeGlobalMatches>} */ ({
      live: [],
      results: [],
      upcoming: [],
    }),
  )
  const [matchDetails, setMatchDetails] = useState(
    /** @type {Map<number, { events: unknown[], lineups: unknown[] }>} */ (
      new Map()
    ),
  )
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(/** @type {Date | null} */ (null))
  const mounted = useRef(true)
  const hasLoaded = useRef(false)

  const setters = {
    setEntries,
    setIndex,
    setLiveMatches,
    setMatchDetails,
    setGlobalMatches,
    setGlobalBuckets,
    setLastUpdated,
    setHasLoaded: (v) => {
      hasLoaded.current = v
    },
  }

  const fetchOnce = useCallback(async () => {
    if (!enabled) return
    if (!hasLoaded.current) setLoading(true)
    setError(null)
    try {
      const json = await fetchScoreboardJson(scope)
      applyScoreboard(scope, json, setters, mounted)
    } catch (e) {
      if (!mounted.current) return
      const msg = e instanceof Error ? e.message : "Failed to load scoreboard"
      setError(msg)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [enabled, scope])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      hasLoaded.current = false
      return undefined
    }

    if (!hasLoaded.current) setLoading(true)

    const streamUrl = streamUrlFor(scope)
    /** @type {EventSource | null} */
    let source = null
    let pollId = 0
    let usePolling = false

    const startPolling = () => {
      if (usePolling) return
      usePolling = true
      void fetchOnce()
      pollId = window.setInterval(() => {
        void fetchOnce()
      }, pollIntervalMs)
    }

    try {
      source = new EventSource(streamUrl)

      source.onmessage = (ev) => {
        try {
          const json = JSON.parse(ev.data)
          applyScoreboard(scope, json, setters, mounted)
          setError(null)
          setLoading(false)
        } catch {
          /* ignore parse errors */
        }
      }

      source.onerror = () => {
        source?.close()
        source = null
        startPolling()
      }

      const fallbackTimer = window.setTimeout(() => {
        if (!hasLoaded.current) {
          source?.close()
          source = null
          startPolling()
        }
      }, 4_000)

      return () => {
        window.clearTimeout(fallbackTimer)
        source?.close()
        if (pollId) window.clearInterval(pollId)
      }
    } catch {
      startPolling()
      return () => {
        if (pollId) window.clearInterval(pollId)
      }
    }
  }, [enabled, fetchOnce, pollIntervalMs, scope])

  return {
    index,
    entries,
    liveMatches,
    globalMatches,
    globalBuckets,
    matchDetails,
    error,
    loading,
    lastUpdated,
    reload: fetchOnce,
    pollSeconds: pollIntervalMs / 1000,
  }
}
