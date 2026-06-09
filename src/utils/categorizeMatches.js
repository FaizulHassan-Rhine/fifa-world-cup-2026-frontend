import { DateTime } from "luxon"
import { LIVE_MATCH_STATUSES } from "./mergeLiveFixtures.js"
import { findLiveForMatch } from "./mergeLiveFixtures.js"
import { parseKickoffEt } from "./timeFormat.js"

const ZONE_ET = "America/New_York"

/**
 * @typedef {{
 *   match: Record<string, unknown>
 *   live: ReturnType<typeof findLiveForMatch>
 * }} CategorizedRow
 */

/**
 * @param {Record<string, unknown>[]} schedule
 * @param {Map<string, ReturnType<typeof findLiveForMatch>[]>} index
 */
export function categorizeScheduleMatches(schedule, index) {
  /** @type {CategorizedRow[]} */
  const live = []
  /** @type {CategorizedRow[]} */
  const results = []
  /** @type {CategorizedRow[]} */
  const upcoming = []

  const now = DateTime.now().setZone(ZONE_ET)

  for (const match of schedule) {
    const liveData = findLiveForMatch(match, index)
    const status = liveData?.statusShort ?? "NS"
    const row = { match, live: liveData }

    if (LIVE_MATCH_STATUSES.has(status)) {
      live.push(row)
      continue
    }

    if (status === "FT") {
      results.push(row)
      continue
    }

    const kickoff = parseKickoffEt(match.kickoffEt)
    if (kickoff > now) {
      upcoming.push(row)
      continue
    }

    if (liveData && status !== "NS") {
      results.push(row)
    } else {
      upcoming.push(row)
    }
  }

  return { live, results, upcoming }
}
