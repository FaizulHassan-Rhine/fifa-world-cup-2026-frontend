/**
 * @param {{ value?: number, displayValue?: string }} [clock]
 */
function parseMinute(clock) {
  if (!clock) return ""
  if (clock.displayValue) return clock.displayValue
  if (clock.value != null) return `${Math.floor(clock.value / 60)}'`
  return ""
}

/**
 * @param {unknown} keyEvents
 * @param {string} homeTeamName
 * @param {string} awayTeamName
 */
export function normalizeEspnKeyEvents(keyEvents, homeTeamName, awayTeamName) {
  if (!Array.isArray(keyEvents)) return []

  const homeKey = homeTeamName.toLowerCase()
  const awayKey = awayTeamName.toLowerCase()

  /** @type {{ type: string, minute: string, side: "home" | "away" | "center", homeScore?: number, awayScore?: number, scorer?: string, assist?: string, playerIn?: string, playerOut?: string, cardPlayer?: string, cardType?: string, label?: string }[]} */
  const out = []
  let homeGoals = 0
  let awayGoals = 0

  const chronological = [...keyEvents].sort(
    (a, b) =>
      (/** @type {{ clock?: { value?: number } }} */ (a).clock?.value ?? 0) -
      (/** @type {{ clock?: { value?: number } }} */ (b).clock?.value ?? 0),
  )

  for (const raw of chronological) {
    if (!raw || typeof raw !== "object") continue
    const e = /** @type {Record<string, unknown>} */ (raw)
    const typeObj = /** @type {{ text?: string, type?: string }} */ (e.type)
    const typeText = typeObj?.text ?? ""
    const typeSlug = typeObj?.type ?? ""
    const minute = parseMinute(
      /** @type {{ value?: number, displayValue?: string }} */ (e.clock),
    )
    const team = /** @type {{ displayName?: string }} */ (e.team)
    const teamName = (team?.displayName ?? "").toLowerCase()
    let side = "away"
    if (teamName && (teamName === homeKey || teamName.includes(homeKey) || homeKey.includes(teamName))) {
      side = "home"
    } else if (teamName && (teamName === awayKey || teamName.includes(awayKey) || awayKey.includes(teamName))) {
      side = "away"
    }

    const participants = /** @type {{ athlete?: { displayName?: string, shortName?: string } }[]} */ (
      e.participants
    )
    const p0 = participants?.[0]?.athlete
    const p1 = participants?.[1]?.athlete

    if (/^halftime$/i.test(typeText) || typeSlug === "halftime") {
      out.push({
        type: "divider",
        minute: "",
        side: "center",
        label: `HT ${homeGoals} – ${awayGoals}`,
      })
      continue
    }

    if (/^end regular time$/i.test(typeText)) {
      out.push({
        type: "divider",
        minute: "",
        side: "center",
        label: `FT ${homeGoals} – ${awayGoals}`,
      })
      continue
    }

    if (/^kickoff$/i.test(typeText) || /^start 2nd half$/i.test(typeText)) {
      continue
    }

    if (e.scoringPlay || /goal/i.test(typeText)) {
      if (side === "home") homeGoals += 1
      else awayGoals += 1
      out.push({
        type: "goal",
        minute,
        side,
        homeScore: homeGoals,
        awayScore: awayGoals,
        scorer: p0?.shortName ?? p0?.displayName ?? "—",
        assist: p1?.shortName ?? p1?.displayName,
      })
      continue
    }

    if (/substitution/i.test(typeText)) {
      out.push({
        type: "substitution",
        minute,
        side,
        playerIn: p0?.shortName ?? p0?.displayName ?? "—",
        playerOut: p1?.shortName ?? p1?.displayName ?? "—",
      })
      continue
    }

    if (/yellow card/i.test(typeText)) {
      out.push({
        type: "card",
        minute,
        side,
        cardType: "yellow",
        cardPlayer: p0?.shortName ?? p0?.displayName ?? "—",
      })
      continue
    }

    if (/red card/i.test(typeText)) {
      out.push({
        type: "card",
        minute,
        side,
        cardType: "red",
        cardPlayer: p0?.shortName ?? p0?.displayName ?? "—",
      })
    }
  }

  return out.reverse()
}
