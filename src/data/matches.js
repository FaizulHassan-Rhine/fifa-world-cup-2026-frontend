import { GROUP_MATCHES } from "./groupMatches.js"
import { KO_MATCHES } from "./knockoutMatches.js"
import { parseKickoffEt } from "../utils/timeFormat.js"

export function buildFullSchedule() {
  const sortedGroups = [...GROUP_MATCHES].sort(
    (a, b) =>
      parseKickoffEt(a.kickoffEt).toMillis() -
      parseKickoffEt(b.kickoffEt).toMillis(),
  )
  const numberedGroups = sortedGroups.map((m, i) => ({
    ...m,
    matchNumber: i + 1,
  }))
  return [...numberedGroups, ...KO_MATCHES]
}
