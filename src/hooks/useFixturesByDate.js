import { useCallback, useEffect, useState } from "react"
import { fetchFixtures } from "../api/footballClient.js"
import { normalizeFixtureList } from "../utils/mergeLiveFixtures.js"

/**
 * @param {{ date: string, leagueId?: string, liveOnly?: boolean }} opts
 */
export function useFixturesByDate(opts) {
  const { date, leagueId, liveOnly = false } = opts
  const [fixtures, setFixtures] = useState(/** @type {unknown[]} */ ([]))
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      if (liveOnly) {
        const json = await fetchFixtures({ live: "all" })
        setFixtures(normalizeFixtureList(json))
      } else {
        const params = /** @type {Parameters<typeof fetchFixtures>[0]} */ ({
          date,
        })
        if (leagueId?.trim()) params.league = leagueId.trim()
        const json = await fetchFixtures(params)
        setFixtures(normalizeFixtureList(json))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed")
      setFixtures([])
    } finally {
      setLoading(false)
    }
  }, [date, leagueId, liveOnly])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  return { fixtures, error, loading, reload: load }
}
