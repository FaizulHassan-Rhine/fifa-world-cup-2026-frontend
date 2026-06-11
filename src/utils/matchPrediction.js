import { DateTime } from "luxon"
import { LIVE_MATCH_STATUSES } from "./mergeLiveFixtures.js"
import { parseKickoffEt } from "./timeFormat.js"

const ZONE_ET = "America/New_York"

/**
 * @param {{ kickoffEt?: string } | null | undefined} match
 * @param {{ statusShort?: string } | null | undefined} [live]
 */
export function hasMatchStarted(match, live) {
  const status = live?.statusShort ?? "NS"
  if (status === "FT" || LIVE_MATCH_STATUSES.has(status)) {
    return true
  }
  if (!match?.kickoffEt) return false
  const kickoff = parseKickoffEt(match.kickoffEt)
  const now = DateTime.now().setZone(ZONE_ET)
  return kickoff <= now
}

/**
 * @param {{ kickoffEt?: string } | null | undefined} match
 * @param {{ statusShort?: string } | null | undefined} [live]
 * @param {boolean} [finished]
 */
export function canSubmitPrediction(match, live, finished = false) {
  if (finished) return false
  return !hasMatchStarted(match, live)
}
