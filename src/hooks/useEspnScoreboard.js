import { useCallback, useEffect, useRef, useState } from "react"
import { fetchEspnScoreboard } from "../api/espnClient.js"
import {
  buildEspnFixtureIndex,
  buildEspnMatchDetailsMap,
  findLiveEspnMatches,
  normalizeEspnEventList,
} from "../utils/mergeEspnScoreboard.js"

const POLL_MS = 15_000

/**
 * Polls ESPN scoreboard every 15s while `enabled`. Free API — no quota concerns.
 *
 * @param {{ enabled?: boolean, pollIntervalMs?: number }} opts
 */
export function useEspnScoreboard(opts = {}) {
  const { enabled = false, pollIntervalMs = POLL_MS } = opts
  const [index, setIndex] = useState(
    /** @type {ReturnType<typeof buildEspnFixtureIndex>} */ (new Map()),
  )
  const [entries, setEntries] = useState(/** @type {unknown[]} */ ([]))
  const [liveMatches, setLiveMatches] = useState(
    /** @type {ReturnType<typeof findLiveEspnMatches>} */ ([]),
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

  const load = useCallback(async () => {
    if (!enabled) return
    if (!hasLoaded.current) setLoading(true)
    setError(null)
    try {
      const json = await fetchEspnScoreboard()
      const list = normalizeEspnEventList(json)

      if (!mounted.current) return
      setEntries(list)
      setIndex(buildEspnFixtureIndex(list))
      setLiveMatches(findLiveEspnMatches(list))
      setMatchDetails(buildEspnMatchDetailsMap(list))
      setLastUpdated(new Date())
      hasLoaded.current = true
    } catch (e) {
      if (!mounted.current) return
      const msg = e instanceof Error ? e.message : "Failed to load ESPN scoreboard"
      console.warn("[EspnScoreboard]", msg)
      setError(msg)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      hasLoaded.current = false
      const t = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(t)
    }

    void load()
    const id = window.setInterval(() => {
      void load()
    }, pollIntervalMs)

    return () => window.clearInterval(id)
  }, [enabled, load, pollIntervalMs])

  return {
    index,
    entries,
    liveMatches,
    matchDetails,
    error,
    loading,
    lastUpdated,
    reload: load,
  }
}
