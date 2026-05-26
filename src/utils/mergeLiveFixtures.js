import { DateTime } from "luxon"
import { GROUPS } from "../data/groups.js"
import { apiTeamToCode } from "./teamAlias.js"
import { parseKickoffEt } from "./timeFormat.js"

const ZONE_ET = "America/New_York"

const WORLD_CUP_TEAM_CODES = new Set(
  Object.values(GROUPS).flatMap((teams) => teams.map((t) => t.code)),
)

/**
 * @param {string} iso
 */
function fixtureEtDay(iso) {
  if (!iso) return null
  const dt = DateTime.fromISO(iso, { setZone: true })
  if (!dt.isValid) return null
  return dt.setZone(ZONE_ET).toFormat("yyyy-LL-dd")
}

/**
 * @param {unknown} raw
 * @returns {unknown[]}
 */
export function normalizeFixtureList(raw) {
  if (!raw || typeof raw !== "object") return []
  const r = /** @type {{ response?: unknown[] }} */ (raw).response
  return Array.isArray(r) ? r : []
}

/**
 * @param {unknown} entry
 */
function mapFixtureToLive(entry) {
  if (!entry || typeof entry !== "object") return null
  const o = /** @type {Record<string, unknown>} */ (entry)
  const fixture = /** @type {Record<string, unknown>} */ (o.fixture)
  const teams = /** @type {Record<string, unknown>} */ (o.teams)
  const goals = /** @type {Record<string, unknown>} */ (o.goals)
  const status = /** @type {Record<string, unknown>} */ (fixture?.status)
  const home = /** @type {{ name?: string, code?: string }} */ (teams?.home)
  const away = /** @type {{ name?: string, code?: string }} */ (teams?.away)

  const date = /** @type {string | undefined} */ (fixture?.date)
  const day = fixtureEtDay(date)
  const ch = apiTeamToCode(home)
  const ca = apiTeamToCode(away)
  if (!day || !ch || !ca) return null

  const homeGoals = goals?.home
  const awayGoals = goals?.away
  const statusShort = /** @type {string | undefined} */ (status?.short)
  const elapsed = /** @type {number | null | undefined} */ (status?.elapsed)

  return {
    day,
    apiHome: ch,
    apiAway: ca,
    homeGoals: typeof homeGoals === "number" ? homeGoals : null,
    awayGoals: typeof awayGoals === "number" ? awayGoals : null,
    statusShort: statusShort ?? "",
    elapsed: elapsed ?? null,
  }
}

/**
 * @param {unknown[]} fixtureEntries
 */
export function buildFixtureIndex(fixtureEntries) {
  /** @type {Map<string, ReturnType<typeof mapFixtureToLive>[]>} */
  const byDay = new Map()

  for (const entry of fixtureEntries) {
    if (!entry || typeof entry !== "object") continue

    const live = mapFixtureToLive(entry)
    if (!live) continue
    if (
      !WORLD_CUP_TEAM_CODES.has(live.apiHome) ||
      !WORLD_CUP_TEAM_CODES.has(live.apiAway)
    ) {
      continue
    }
    const list = byDay.get(live.day) ?? []
    list.push(live)
    byDay.set(live.day, list)
  }
  return byDay
}

/**
 * @param {{ home: { code: string | null }, away: { code: string | null }, kickoffEt: string }} match
 * @param {Map<string, ReturnType<typeof mapFixtureToLive>[]>} index
 */
export function findLiveForMatch(match, index) {
  const homeCode = match.home?.code
  const awayCode = match.away?.code
  if (!homeCode || !awayCode) return null

  const day = parseKickoffEt(match.kickoffEt).toFormat("yyyy-LL-dd")
  const candidates = index.get(day)
  if (!candidates?.length) return null

  for (const c of candidates) {
    if (c.apiHome === homeCode && c.apiAway === awayCode) {
      return {
        homeGoals: c.homeGoals,
        awayGoals: c.awayGoals,
        statusShort: c.statusShort,
        elapsed: c.elapsed,
      }
    }
    if (c.apiHome === awayCode && c.apiAway === homeCode) {
      return {
        homeGoals: c.awayGoals,
        awayGoals: c.homeGoals,
        statusShort: c.statusShort,
        elapsed: c.elapsed,
      }
    }
  }
  return null
}
