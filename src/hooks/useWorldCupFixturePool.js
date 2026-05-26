import { useCallback, useEffect, useRef, useState } from "react"
import { DateTime } from "luxon"
import { fetchFixtures } from "../api/footballClient.js"
import { buildFixtureIndex, normalizeFixtureList } from "../utils/mergeLiveFixtures.js"

const ZONE_ET = "America/New_York"

/**
 * Fetches only when `enabled` is true. No polling — call `reload()` to refresh
 * (each call uses your API quota).
 *
 * @param {{ leagueId?: string, enabled?: boolean }} opts
 */
export function useWorldCupFixturePool(opts = {}) {
  const { leagueId, enabled = false } = opts
  const leagueIdTrim = leagueId?.trim()
  const [index, setIndex] = useState(
    /** @type {ReturnType<typeof buildFixtureIndex>} */ (new Map()),
  )
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(/** @type {Date | null} */ (null))
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    const nowEt = DateTime.now().setZone(ZONE_ET)
    const today = nowEt.toFormat("yyyy-LL-dd")
    const tomorrow = nowEt.plus({ days: 1 }).toFormat("yyyy-LL-dd")

    try {
      const requests = [
        fetchFixtures({ live: "all" }),
        fetchFixtures({ date: today, timezone: ZONE_ET }),
        fetchFixtures({ date: tomorrow, timezone: ZONE_ET }),
      ]

      if (leagueIdTrim) {
        requests.push(
          fetchFixtures({
            league: leagueIdTrim,
            season: 2026,
            from: "2026-06-10",
            to: "2026-07-20",
          }),
        )
      }

      const results = await Promise.all(requests)
      /** @type {unknown[]} */
      const merged = []
      const seen = new Set()
      for (const json of results) {
        for (const row of normalizeFixtureList(json)) {
          const id = /** @type {{ fixture?: { id?: number } }} */ (row).fixture?.id
          const key = id != null ? String(id) : JSON.stringify(row)
          if (seen.has(key)) continue
          seen.add(key)
          merged.push(row)
        }
      }

      if (!mounted.current) return
      setIndex(buildFixtureIndex(merged))
      setLastUpdated(new Date())
    } catch (e) {
      if (!mounted.current) return
      const msg = e instanceof Error ? e.message : "Failed to load fixtures"
      console.warn("[WorldCupFixturePool]", msg)
      setError(msg)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [enabled, leagueIdTrim])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      const t = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(t)
    }

    const kickId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => {
      window.clearTimeout(kickId)
    }
  }, [enabled, load])

  return { index, error, loading, lastUpdated, reload: load }
}
