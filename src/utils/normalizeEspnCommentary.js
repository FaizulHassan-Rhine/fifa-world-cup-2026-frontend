/**
 * @param {string} text
 * @param {string} typeSlug
 */
function classifyCommentary(text, typeSlug) {
  const slug = String(typeSlug).toLowerCase()
  const t = text.toLowerCase()

  if (slug.includes("goal") || /^goal!/.test(t)) return "goal"
  if (slug.includes("yellow") || /yellow card/.test(t) || /shown the yellow/.test(t)) {
    return "yellow"
  }
  if (slug.includes("red") || /red card/.test(t)) return "red"
  if (slug.includes("substitution") || /^substitution/.test(t)) return "substitution"
  if (slug.includes("corner") || /^corner/.test(t)) return "corner"
  if (/attempt blocked/.test(t) || slug.includes("blocked")) return "blocked"
  if (
    /attempt saved|attempt missed|hits the bar|hit the (post|woodwork)|shot/.test(t) ||
    slug.includes("shot")
  ) {
    return "shot"
  }
  if (/foul|free kick/.test(t) || slug.includes("foul")) return "foul"
  if (/offside/.test(t)) return "offside"
  if (/penalt/.test(t)) return "penalty"
  if (
    /kick\s*off|first half|second half|half ends|full time|end of.*half|match ends/.test(
      t,
    )
  ) {
    return "period"
  }
  return "default"
}

/**
 * @param {string} kind
 * @param {string} text
 */
function isKeyCommentary(kind, text) {
  if (["goal", "yellow", "red", "substitution", "penalty", "period"].includes(kind)) {
    return true
  }
  if (kind === "blocked") return true
  if (kind === "shot" && /goal|saved|bar|post|woodwork/i.test(text)) return true
  return false
}

/**
 * @param {string} text
 */
function stripAssistFromText(text) {
  const assistMatch = text.match(/\s*Assisted by\s+([^.]+)\./i)
  if (!assistMatch) {
    return { text, assistPlayer: null }
  }
  return {
    text: text.replace(/\s*Assisted by\s+[^.]+\./i, "").trim(),
    assistPlayer: assistMatch[1].trim(),
  }
}

/**
 * @param {string} text
 * @param {unknown[] | undefined} participants
 */
function parseSubstitutionPlayers(text, participants) {
  const p0 = /** @type {{ athlete?: { displayName?: string, shortName?: string } } | undefined} */ (
    participants?.[0]
  )?.athlete
  const p1 = /** @type {{ athlete?: { displayName?: string, shortName?: string } } | undefined} */ (
    participants?.[1]
  )?.athlete

  if (p0 && p1) {
    return {
      playerIn: p0.shortName ?? p0.displayName ?? null,
      playerOut: p1.shortName ?? p1.displayName ?? null,
    }
  }

  const match = text.match(/\.?\s*([^.,]+?)\s+replaces\s+([^.,]+)\.?/i)
  if (match) {
    return {
      playerIn: match[1].trim(),
      playerOut: match[2].trim(),
    }
  }

  return { playerIn: null, playerOut: null }
}

/**
 * @param {string} text
 */
function substitutionTeamLabel(text) {
  const match = text.match(/^Substitution,\s*([^.]+)\./i)
  return match?.[1]?.trim() ?? null
}

/**
 * ESPN summary `commentary` → commentary feed rows.
 *
 * @param {unknown} commentary
 * @returns {{
 *   id: number
 *   minute: string
 *   text: string
 *   kind: string
 *   isKey: boolean
 *   assistPlayer?: string | null
 *   playerIn?: string | null
 *   playerOut?: string | null
 *   subTeam?: string | null
 * }[]}
 */
export function normalizeEspnCommentary(commentary) {
  if (!Array.isArray(commentary)) return []

  const rows = commentary
    .map((raw, idx) => {
      if (!raw || typeof raw !== "object") return null
      const row = /** @type {Record<string, unknown>} */ (raw)
      const play = /** @type {{
        text?: string
        type?: { type?: string, text?: string }
        clock?: { displayValue?: string }
        participants?: unknown[]
      } | undefined} */ (row.play)
      const rawText = String(row.text ?? play?.text ?? "").trim()
      if (!rawText) return null

      const time = /** @type {{ displayValue?: string }} */ (row.time)
      const minute =
        time?.displayValue?.trim() ||
        play?.clock?.displayValue?.trim() ||
        ""

      const typeSlug = play?.type?.type ?? play?.type?.text ?? ""
      const kind = classifyCommentary(rawText, typeSlug)
      const { text, assistPlayer } = stripAssistFromText(rawText)

      const sub =
        kind === "substitution"
          ? parseSubstitutionPlayers(rawText, play?.participants)
          : { playerIn: null, playerOut: null }

      return {
        id: typeof row.sequence === "number" ? row.sequence : idx,
        minute,
        text,
        kind,
        isKey: isKeyCommentary(kind, rawText),
        assistPlayer,
        playerIn: sub.playerIn,
        playerOut: sub.playerOut,
        subTeam: kind === "substitution" ? substitutionTeamLabel(rawText) : null,
      }
    })
    .filter(Boolean)

  return /** @type {NonNullable<(typeof rows)[number]>[]} */ (rows).reverse()
}
