import { espnTeamToCode } from "./espnTeamAlias.js"
import { flagUrl } from "./flags.js"

/**
 * @param {string | number | undefined} athleteId
 * @returns {string[]}
 */
export function espnPlayerHeadshotUrls(athleteId) {
  if (athleteId == null || athleteId === "") return []
  const id = String(athleteId)
  return [
    `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
    `https://a.espncdn.com/i/headshots/soccer/players/360/${id}.png`,
    `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.jpg`,
  ]
}

/**
 * @param {{
 *   id?: string
 *   jerseyImages?: { href?: string }[]
 * }} athlete
 * @param {number | string | undefined} eventId
 */
export function buildPlayerPhotoUrls(athlete, eventId) {
  /** @type {string[]} */
  const urls = []
  if (athlete?.id) {
    urls.push(...espnPlayerHeadshotUrls(athlete.id))
    if (eventId != null) {
      urls.push(
        `https://stitcher.espn.com/sports/soccer/leagues/all/events/${eventId}/athletes/${athlete.id}/jersey.png?darkMode=false`,
      )
    }
  }
  for (const img of athlete?.jerseyImages ?? []) {
    if (img?.href) urls.push(img.href)
  }
  return [...new Set(urls)]
}

/** @deprecated use buildPlayerPhotoUrls */
export function espnPlayerHeadshotUrl(athleteId) {
  const urls = espnPlayerHeadshotUrls(athleteId)
  return urls[0] ?? null
}

/**
 * @param {unknown} playerRow
 * @param {number | string | undefined} eventId
 */
function mapPlayerEntry(playerRow, eventId) {
  if (!playerRow || typeof playerRow !== "object") return null
  const row = /** @type {Record<string, unknown>} */ (playerRow)
  const athlete = /** @type {{
    id?: string
    displayName?: string
    shortName?: string
    jerseyImages?: { href?: string }[]
  }} */ (row.athlete)
  const jersey = row.jersey
  const name = athlete?.displayName ?? athlete?.shortName
  if (!name) return null
  const number =
    jersey != null && String(jersey).trim() !== ""
      ? parseInt(String(jersey), 10)
      : null
  const photoUrls = buildPlayerPhotoUrls(athlete, eventId)

  const subbedIn = /** @type {{ didSub?: boolean }} */ (row.subbedIn)
  const subbedOut = /** @type {{ didSub?: boolean }} */ (row.subbedOut)
  const position = /** @type {{ abbreviation?: string }} */ (row.position)

  return {
    player: {
      id: athlete?.id ?? null,
      name,
      shortName: athlete?.shortName ?? name,
      number: Number.isFinite(number) ? number : null,
      photoUrl: photoUrls[0] ?? null,
      photoUrls,
    },
    formationPlace:
      row.formationPlace != null
        ? parseInt(String(row.formationPlace), 10)
        : null,
    position: position?.abbreviation ?? null,
    subbedIn: Boolean(subbedIn?.didSub),
    subbedOut: Boolean(subbedOut?.didSub),
  }
}

/**
 * ESPN summary `rosters` → enriched lineup rows for pitch UI.
 *
 * @param {unknown} rosters
 * @param {number | string | undefined} [eventId]
 * @returns {unknown[]}
 */
export function normalizeEspnRostersToLineups(rosters, eventId) {
  if (!Array.isArray(rosters)) return []

  return rosters
    .map((teamRow) => {
      if (!teamRow || typeof teamRow !== "object") return null
      const row = /** @type {Record<string, unknown>} */ (teamRow)
      const team = /** @type {{
        displayName?: string
        id?: string
        abbreviation?: string
        logo?: string
        color?: string
        alternateColor?: string
        logos?: { href?: string }[]
      }} */ (row.team)
      const roster = /** @type {unknown[]} */ (row.roster)
      const formation = /** @type {string | undefined} */ (row.formation)
      const homeAway = /** @type {string | undefined} */ (row.homeAway)
      const code = espnTeamToCode(team)
      const logoUrl = team?.logo ?? team?.logos?.[0]?.href ?? null
      const flagUrlResolved = logoUrl ?? (code ? flagUrl(code) : null)

      const players = Array.isArray(roster) ? roster : []
      const starters = players.filter(
        (p) =>
          p &&
          typeof p === "object" &&
          /** @type {{ starter?: boolean }} */ (p).starter,
      )
      const subs = players.filter(
        (p) =>
          p &&
          typeof p === "object" &&
          !/** @type {{ starter?: boolean }} */ (p).starter,
      )

      return {
        team: {
          name: team?.displayName ?? "Team",
          id: team?.id ?? null,
          code: code ?? null,
          logoUrl,
          flagUrl: flagUrlResolved,
          color: team?.color ?? null,
          alternateColor: team?.alternateColor ?? null,
        },
        homeAway: homeAway ?? null,
        formation: formation ?? undefined,
        startXI: starters.map((p) => mapPlayerEntry(p, eventId)).filter(Boolean),
        substitutes: subs.map((p) => mapPlayerEntry(p, eventId)).filter(Boolean),
      }
    })
    .filter(Boolean)
}
