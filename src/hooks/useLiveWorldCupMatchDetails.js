import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchFixtureEvents,
  fetchFixtureLineups,
} from "../api/footballClient.js"

/**
 * @typedef {{ events: unknown[], lineups: unknown[] }} FixtureDetail
 */

/**
 * @param {number[]} fixtureIds
 * @param {boolean} enabled
 */
export function useLiveWorldCupMatchDetails(fixtureIds, enabled) {
  const [details, setDetails] = useState(
    /** @type {Map<number, FixtureDetail>} */ (new Map()),
  )
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(false)
  const mounted = useRef(true)

  const idsKey = fixtureIds.join(",")

  const load = useCallback(async () => {
    if (!enabled || fixtureIds.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const pairs = await Promise.all(
        fixtureIds.map(async (id) => {
          const [eventsJson, lineupsJson] = await Promise.all([
            fetchFixtureEvents(id),
            fetchFixtureLineups(id),
          ])
          const ev = /** @type {{ response?: unknown[] }} */ (eventsJson).response
          const lu = /** @type {{ response?: unknown[] }} */ (lineupsJson).response
          return [
            id,
            {
              events: Array.isArray(ev) ? ev : [],
              lineups: Array.isArray(lu) ? lu : [],
            },
          ]
        }),
      )
      if (!mounted.current) return
      setDetails(new Map(/** @type {[number, FixtureDetail][]} */ (pairs)))
    } catch (e) {
      if (!mounted.current) return
      const msg = e instanceof Error ? e.message : "Failed to load match details"
      setError(msg)
      setDetails(new Map())
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [enabled, idsKey, fixtureIds])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled || fixtureIds.length === 0) {
      const t = window.setTimeout(() => {
        setDetails(new Map())
        setError(null)
        setLoading(false)
      }, 0)
      return () => window.clearTimeout(t)
    }

    const kickId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(kickId)
  }, [enabled, idsKey, load, fixtureIds.length])

  return { details, error, loading, reload: load }
}
