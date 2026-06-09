import { DateTime } from "luxon"
import { GROUPS } from "../data/groups.js"
import { espnTeamToCode } from "./espnTeamAlias.js"
import { LIVE_MATCH_STATUSES } from "./mergeLiveFixtures.js"

const ZONE_ET = "America/New_York"

const WORLD_CUP_TEAM_CODES = new Set(
  Object.values(GROUPS).flatMap((teams) => teams.map((t) => t.code)),
)

/**
 * @param {string} iso
 */
function eventEtDay(iso) {
  if (!iso) return null
  const dt = DateTime.fromISO(iso, { setZone: true })
  if (!dt.isValid) return null
  return dt.setZone(ZONE_ET).toFormat("yyyy-LL-dd")
}

/**
 * @param {{ name?: string, state?: string, description?: string }} statusType
 * @param {number | null} period
 */
function mapEspnStatusShort(statusType, period) {
  const name = statusType?.name ?? ""
  const state = statusType?.state ?? ""

  if (name.includes("SCHEDULED") || name.includes("DELAYED")) return "NS"
  if (name.includes("HALFTIME")) return "HT"
  if (name.includes("PENALT")) return "P"
  if (name.includes("SHOOTOUT")) return "P"
  if (name.includes("EXTRA")) return "ET"
  if (name.includes("FULL_TIME") || name.includes("FINAL")) return "FT"
  if (name.includes("SECOND_HALF") || period === 2) return "2H"
  if (name.includes("FIRST_HALF") || name.includes("IN_PROGRESS") || state === "in") {
    return period === 2 ? "2H" : "1H"
  }
  if (state === "post" || statusType?.completed) return "FT"
  return statusType?.description?.slice(0, 4).toUpperCase() ?? "NS"
}

/**
 * @param {string | number | null | undefined} display
 */
function parseMinuteFromDisplay(display) {
  if (display == null || display === "") return null
  const text = String(display).trim()
  const match = text.match(/^(\d+)(?:\+(\d+))?'?$/)
  if (!match) return null
  const base = parseInt(match[1], 10)
  const extra = match[2] ? parseInt(match[2], 10) : 0
  if (!Number.isFinite(base)) return null
  return base + (Number.isFinite(extra) ? extra : 0)
}

/**
 * ESPN event clocks are seconds; `displayClock` is the match minute label.
 *
 * @param {Record<string, unknown> | null | undefined} status
 */
function parseEspnStatusElapsed(status) {
  if (!status || typeof status !== "object") return null

  const displayClock = /** @type {string | undefined} */ (status.displayClock)
  const statusType = /** @type {{ detail?: string, shortDetail?: string }} */ (
    status.type
  )
  const fromDisplay =
    parseMinuteFromDisplay(displayClock) ??
    parseMinuteFromDisplay(statusType?.detail) ??
    parseMinuteFromDisplay(statusType?.shortDetail)
  if (fromDisplay != null) return fromDisplay

  const clock = status.clock
  if (clock == null || clock === "") return null
  const n = typeof clock === "number" ? clock : parseFloat(String(clock))
  if (!Number.isFinite(n)) return null
  return Math.floor(n / 60)
}

/**
 * @param {number | string | undefined} clock
 * @param {string | undefined} [displayValue]
 */
function parseElapsed(clock, displayValue) {
  const fromDisplay = parseMinuteFromDisplay(displayValue)
  if (fromDisplay != null) return fromDisplay

  if (clock == null || clock === "") return null
  const n = typeof clock === "number" ? clock : parseFloat(String(clock))
  if (!Number.isFinite(n)) return null
  return Math.floor(n / 60)
}

/**
 * @param {Record<string, unknown> | null | undefined} status
 */
function formatEspnElapsedDisplay(status) {
  if (!status || typeof status !== "object") return null
  const displayClock = /** @type {string | undefined} */ (status.displayClock)
  if (displayClock) return displayClock.replace(/\s+/g, "")
  const statusType = /** @type {{ detail?: string, shortDetail?: string }} */ (
    status.type
  )
  const detail = statusType?.shortDetail ?? statusType?.detail
  if (detail) return detail.replace(/\s+/g, "")
  const elapsed = parseEspnStatusElapsed(status)
  return elapsed != null ? `${elapsed}'` : null
}

/**
 * @param {unknown} detail
 */
function normalizeEspnDetail(detail) {
  if (!detail || typeof detail !== "object") return null
  const d = /** @type {Record<string, unknown>} */ (detail)
  const typeObj = /** @type {{ text?: string, id?: string }} */ (d.type)
  const typeText = (typeObj?.text ?? "").trim()
  const text = /** @type {string | undefined} */ (d.text)
  const clockObj = /** @type {{ value?: number, displayValue?: string }} */ (d.clock)
  const team = /** @type {{ displayName?: string, abbreviation?: string }} */ (d.team)
  const athletes = /** @type {unknown[] | undefined} */ (d.athletesInvolved)

  const rawLabel = (text || typeText).trim()
  if (!rawLabel) return null

  const lower = rawLabel.toLowerCase()
  const elapsed = parseElapsed(clockObj?.value, clockObj?.displayValue)
  const extraMatch = clockObj?.displayValue?.match(/\+(\d+)/)
  const extra = extraMatch ? parseInt(extraMatch[1], 10) : null

  let type = "Event"
  let eventDetail = rawLabel

  if (lower.includes("kick") && lower.includes("off")) {
    type = "Kickoff"
    eventDetail = "Kick-off"
  } else if (lower.includes("halftime") || lower === "half time") {
    type = "Halftime"
    eventDetail = "Halftime"
  } else if (
    lower.includes("penalt") &&
    (lower.includes("shoot") || lower.includes("won") || lower.includes("miss"))
  ) {
    type = "Shootout"
    eventDetail = rawLabel
  } else if (lower.includes("going to penalt") || lower.includes("penalty shootout")) {
    type = "Shootout"
    eventDetail = "Going to penalties"
  } else if (lower.includes("goal")) {
    type = "Goal"
    if (lower.includes("penalty") || lower.includes("pen ")) {
      eventDetail = "Penalty"
    } else if (lower.includes("own goal")) {
      eventDetail = "Own Goal"
    } else {
      eventDetail = "Normal Goal"
    }
  } else if (lower.includes("full time") || lower.includes("full-time")) {
    type = "FullTime"
    eventDetail = "Full time"
  } else if (lower.includes("extra time")) {
    type = "ExtraTime"
    eventDetail = rawLabel
  }

  let playerName = null
  if (Array.isArray(athletes) && athletes.length > 0) {
    const first = /** @type {{ displayName?: string, shortName?: string }} */ (
      athletes[0]
    )
    playerName = first?.displayName ?? first?.shortName ?? null
  }
  if (!playerName && text) {
    const dash = text.indexOf(" - ")
    if (dash > 0 && type === "Goal") {
      playerName = text.slice(dash + 3).trim()
    }
  }

  const teamName = team?.displayName ?? team?.abbreviation ?? ""

  return {
    type,
    time: { elapsed, extra },
    player: { name: playerName ?? "—" },
    team: { name: teamName },
    detail: eventDetail,
    rawText: rawLabel,
  }
}

/**
 * @param {string | undefined} slug
 */
export function formatEspnLeagueLabel(slug) {
  if (!slug) return "Football"
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
}

/**
 * @param {unknown} event
 * @param {{ requireTeamCodes?: boolean }} [opts]
 */
export function mapEspnEventToMatch(event, opts = {}) {
  const { requireTeamCodes = false } = opts
  if (!event || typeof event !== "object") return null
  const e = /** @type {Record<string, unknown>} */ (event)
  const competitions = /** @type {unknown[]} */ (e.competitions)
  const comp = competitions?.[0]
  if (!comp || typeof comp !== "object") return null
  const c = /** @type {Record<string, unknown>} */ (comp)

  const competitors = /** @type {unknown[]} */ (c.competitors)
  if (!Array.isArray(competitors) || competitors.length < 2) return null

  const homeRow = competitors.find(
    (row) =>
      row &&
      typeof row === "object" &&
      /** @type {{ homeAway?: string }} */ (row).homeAway === "home",
  )
  const awayRow = competitors.find(
    (row) =>
      row &&
      typeof row === "object" &&
      /** @type {{ homeAway?: string }} */ (row).homeAway === "away",
  )
  if (!homeRow || !awayRow || typeof homeRow !== "object" || typeof awayRow !== "object") {
    return null
  }

  const home = /** @type {Record<string, unknown>} */ (homeRow)
  const away = /** @type {Record<string, unknown>} */ (awayRow)
  const homeTeam = /** @type {{ displayName?: string, abbreviation?: string, logo?: string }} */ (
    home.team
  )
  const awayTeam = /** @type {{ displayName?: string, abbreviation?: string, logo?: string }} */ (
    away.team
  )

  const apiHome = espnTeamToCode(homeTeam) ?? homeTeam?.abbreviation ?? null
  const apiAway = espnTeamToCode(awayTeam) ?? awayTeam?.abbreviation ?? null
  const date = /** @type {string | undefined} */ (e.date ?? c.date)
  const day = eventEtDay(date)
  if (!day) return null
  if (requireTeamCodes && (!apiHome || !apiAway)) return null

  const status = /** @type {Record<string, unknown>} */ (c.status ?? e.status)
  const statusType = /** @type {{ name?: string, state?: string, description?: string, completed?: boolean }} */ (
    status?.type
  )
  const period = /** @type {number | undefined} */ (
    /** @type {{ period?: number }} */ (status)?.period
  )
  const statusShort = mapEspnStatusShort(statusType, period ?? null)
  const elapsed = parseEspnStatusElapsed(status)
  const elapsedDisplay = formatEspnElapsedDisplay(status)

  const homeScore = parseInt(String(home.score ?? ""), 10)
  const awayScore = parseInt(String(away.score ?? ""), 10)

  const eventId = /** @type {string | number | undefined} */ (e.id)
  const fixtureId =
    typeof eventId === "number"
      ? eventId
      : eventId != null
        ? parseInt(String(eventId), 10)
        : null

  const details = /** @type {unknown[]} */ (c.details)
  const events = Array.isArray(details)
    ? details
        .map(normalizeEspnDetail)
        .filter((row) => row != null)
    : []

  const season = /** @type {{ slug?: string }} */ (e.season)
  const venue = /** @type {{ fullName?: string, address?: { city?: string } }} */ (
    c.venue
  )

  return {
    fixtureId: Number.isFinite(fixtureId) ? fixtureId : null,
    day,
    apiHome: apiHome ?? "—",
    apiAway: apiAway ?? "—",
    homeName: homeTeam?.displayName ?? apiHome ?? "Home",
    awayName: awayTeam?.displayName ?? apiAway ?? "Away",
    homeLogo: homeTeam?.logo ?? null,
    awayLogo: awayTeam?.logo ?? null,
    homeGoals: Number.isFinite(homeScore) ? homeScore : null,
    awayGoals: Number.isFinite(awayScore) ? awayScore : null,
    statusShort,
    elapsed,
    elapsedDisplay,
    events,
    espnStatusName: statusType?.name ?? "",
    leagueLabel: formatEspnLeagueLabel(season?.slug),
    kickoffIso: date ?? null,
    venueName: venue?.fullName ?? null,
    venueCity: venue?.address?.city ?? null,
  }
}

/**
 * @param {unknown} event
 */
export function mapEspnEventToLive(event) {
  return mapEspnEventToMatch(event, { requireTeamCodes: true })
}

/**
 * @param {unknown} scoreboardJson
 * @returns {unknown[]}
 */
export function normalizeEspnEventList(scoreboardJson) {
  if (!scoreboardJson || typeof scoreboardJson !== "object") return []
  const events = /** @type {{ events?: unknown[] }} */ (scoreboardJson).events
  return Array.isArray(events) ? events : []
}

/**
 * @param {unknown[]} espnEvents
 */
export function buildEspnFixtureIndex(espnEvents) {
  /** @type {Map<string, NonNullable<ReturnType<typeof mapEspnEventToLive>>[]>} */
  const byDay = new Map()

  for (const event of espnEvents) {
    const live = mapEspnEventToLive(event)
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
 * @param {unknown[]} espnEvents
 */
export function findLiveEspnMatches(espnEvents) {
  /** @type {NonNullable<ReturnType<typeof mapEspnEventToLive>>[]} */
  const out = []
  for (const event of espnEvents) {
    const live = mapEspnEventToLive(event)
    if (!live?.fixtureId) continue
    if (
      !WORLD_CUP_TEAM_CODES.has(live.apiHome) ||
      !WORLD_CUP_TEAM_CODES.has(live.apiAway)
    ) {
      continue
    }
    if (!LIVE_MATCH_STATUSES.has(live.statusShort)) continue
    out.push(live)
  }
  return out
}

/**
 * @param {unknown[]} espnEvents
 * @returns {Map<number, { events: unknown[], lineups: unknown[] }>}
 */
export function buildEspnMatchDetailsMap(espnEvents) {
  /** @type {Map<number, { events: unknown[], lineups: unknown[] }>} */
  const map = new Map()
  for (const event of espnEvents) {
    const live = mapEspnEventToLive(event)
    if (!live?.fixtureId) continue
    map.set(live.fixtureId, {
      events: live.events,
      lineups: [],
    })
  }
  return map
}
