/** @typedef {{ name?: string, displayValue?: string, label?: string }} EspnStat */

/** @type {{ key: string, label: string }[]} */
const STAT_ORDER = [
  { key: "totalShots", label: "Total shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "saves", label: "Goalkeeper saves" },
  { key: "wonCorners", label: "Corner kicks" },
  { key: "foulsCommitted", label: "Fouls" },
  { key: "totalPasses", label: "Passes" },
  { key: "totalTackles", label: "Tackles" },
  { key: "yellowCards", label: "Yellow cards" },
  { key: "offsides", label: "Offsides" },
  { key: "redCards", label: "Red cards" },
  { key: "blockedShots", label: "Blocked shots" },
  { key: "interceptions", label: "Interceptions" },
]

/**
 * @param {EspnStat[] | undefined} list
 * @returns {Map<string, number>}
 */
function statMap(list) {
  /** @type {Map<string, number>} */
  const map = new Map()
  if (!Array.isArray(list)) return map
  for (const row of list) {
    if (!row?.name) continue
    const n = parseFloat(String(row.displayValue ?? ""))
    if (Number.isFinite(n)) map.set(row.name, n)
  }
  return map
}

/**
 * ESPN summary `boxscore` → match overview stats for UI.
 *
 * @param {unknown} boxscore
 * @returns {{
 *   homeName: string
 *   awayName: string
 *   possession: { home: number, away: number } | null
 *   rows: { key: string, label: string, home: number, away: number }[]
 * } | null}
 */
export function normalizeEspnBoxscoreStats(boxscore) {
  if (!boxscore || typeof boxscore !== "object") return null
  const teams = /** @type {unknown[]} */ (
    /** @type {{ teams?: unknown[] }} */ (boxscore).teams
  )
  if (!Array.isArray(teams) || teams.length < 2) return null

  const homeRow =
    teams.find(
      (t) =>
        t &&
        typeof t === "object" &&
        /** @type {{ homeAway?: string }} */ (t).homeAway === "home",
    ) ?? teams[0]
  const awayRow =
    teams.find(
      (t) =>
        t &&
        typeof t === "object" &&
        /** @type {{ homeAway?: string }} */ (t).homeAway === "away",
    ) ?? teams[1]

  if (!homeRow || !awayRow || typeof homeRow !== "object" || typeof awayRow !== "object") {
    return null
  }

  const home = /** @type {{ team?: { displayName?: string }, statistics?: EspnStat[] }} */ (
    homeRow
  )
  const away = /** @type {{ team?: { displayName?: string }, statistics?: EspnStat[] }} */ (
    awayRow
  )

  const homeStats = statMap(home.statistics)
  const awayStats = statMap(away.statistics)

  if (homeStats.size === 0 && awayStats.size === 0) return null

  const homePoss = homeStats.get("possessionPct")
  const awayPoss = awayStats.get("possessionPct")
  const possession =
    homePoss != null && awayPoss != null
      ? { home: homePoss, away: awayPoss }
      : homePoss != null
        ? { home: homePoss, away: Math.max(0, 100 - homePoss) }
        : null

  const rows = STAT_ORDER.map(({ key, label }) => ({
    key,
    label,
    home: homeStats.get(key) ?? 0,
    away: awayStats.get(key) ?? 0,
  })).filter((row) => homeStats.has(row.key) || awayStats.has(row.key))

  if (!possession && rows.length === 0) return null

  return {
    homeName: home.team?.displayName ?? "Home",
    awayName: away.team?.displayName ?? "Away",
    possession,
    rows,
  }
}
