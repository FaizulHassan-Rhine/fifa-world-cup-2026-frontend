import { LIVE_MATCH_STATUSES } from "./mergeLiveFixtures.js"
import {
  mapEspnEventToMatch,
  normalizeEspnEventList,
} from "./mergeEspnScoreboard.js"

/**
 * @param {unknown[]} espnEvents
 */
export function mapGlobalEspnMatches(espnEvents) {
  /** @type {NonNullable<ReturnType<typeof mapEspnEventToMatch>>[]} */
  const out = []
  for (const event of espnEvents) {
    const row = mapEspnEventToMatch(event)
    if (row?.fixtureId) out.push(row)
  }
  return out
}

/**
 * @param {NonNullable<ReturnType<typeof mapEspnEventToMatch>>[]} matches
 */
export function categorizeGlobalMatches(matches) {
  /** @type {typeof matches} */
  const live = []
  /** @type {typeof matches} */
  const results = []
  /** @type {typeof matches} */
  const upcoming = []

  for (const match of matches) {
    if (LIVE_MATCH_STATUSES.has(match.statusShort)) {
      live.push(match)
    } else if (match.statusShort === "FT") {
      results.push(match)
    } else {
      upcoming.push(match)
    }
  }

  live.sort((a, b) => (b.elapsed ?? 0) - (a.elapsed ?? 0))
  results.sort((a, b) =>
    String(b.kickoffIso ?? "").localeCompare(String(a.kickoffIso ?? "")),
  )
  upcoming.sort((a, b) =>
    String(a.kickoffIso ?? "").localeCompare(String(b.kickoffIso ?? "")),
  )

  return { live, results, upcoming }
}

/**
 * @param {unknown[]} scoreboardJsonList
 */
export function mergeEspnEventLists(scoreboardJsonList) {
  /** @type {unknown[]} */
  const merged = []
  const seen = new Set()
  for (const json of scoreboardJsonList) {
    for (const event of normalizeEspnEventList(json)) {
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
 * @param {unknown[]} espnEvents
 */
export function findLiveGlobalMatches(espnEvents) {
  return mapGlobalEspnMatches(espnEvents).filter((m) =>
    LIVE_MATCH_STATUSES.has(m.statusShort),
  )
}

/**
 * @param {unknown[]} espnEvents
 */
export function buildGlobalMatchDetailsMap(espnEvents) {
  /** @type {Map<number, { events: unknown[], lineups: unknown[] }>} */
  const map = new Map()
  for (const match of mapGlobalEspnMatches(espnEvents)) {
    if (!match.fixtureId) continue
    map.set(match.fixtureId, { events: match.events, lineups: [] })
  }
  return map
}
