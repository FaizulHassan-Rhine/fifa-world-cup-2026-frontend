import { layoutFormationPlayers } from "../utils/formationCoords.js"

/** @param {string | null | undefined} hex */
function toHexColor(hex) {
  if (!hex) return null
  const clean = hex.replace("#", "").trim()
  return clean ? `#${clean}` : null
}

/**
 * @param {string} raw
 */
function surnameFromText(raw) {
  const text = String(raw ?? "?").trim()
  const afterDot = text.match(/\.\s*(.+)$/)
  if (afterDot) return afterDot[1]
  const parts = text.split(/\s+/)
  return parts[parts.length - 1] || text
}

/**
 * @param {{ shortName?: string, name?: string }} player
 */
function lineupLabel(player) {
  return surnameFromText(player.shortName ?? player.name ?? "?")
}

/**
 * @param {{ shortName?: string, name?: string }} player
 * @param {unknown[]} keyEvents
 */
function nameMatchesPlayer(player, name) {
  const labels = [player.shortName, player.name]
    .filter(Boolean)
    .map((n) => String(n).toLowerCase())
  const n = String(name ?? "").toLowerCase()
  return labels.some((l) => l === n || l.includes(n) || n.includes(l))
}

/**
 * @param {unknown[]} keyEvents
 * @param {string | null | undefined} homeAway
 */
function keyEventsForTeam(keyEvents, homeAway) {
  if (!homeAway) return keyEvents
  return keyEvents.filter((raw) => {
    if (!raw || typeof raw !== "object") return false
    const side = /** @type {{ side?: string }} */ (raw).side
    if (!side || side === "center") return true
    return side === homeAway
  })
}

/**
 * @param {{ shortName?: string, name?: string }} player
 * @param {unknown[]} keyEvents
 */
function playerMatchEvents(player, keyEvents) {
  /** @type {{ minute?: string, assist?: string }[]} */
  const goals = []
  /** @type {{ minute?: string, partner: string, direction: "in" | "out" }[]} */
  const substitutions = []
  let assistCount = 0
  /** @type {"yellow" | "red" | null} */
  let card = null

  for (const raw of keyEvents) {
    if (!raw || typeof raw !== "object") continue
    const ev = /** @type {Record<string, unknown>} */ (raw)

    if (ev.type === "goal" && nameMatchesPlayer(player, ev.scorer)) {
      goals.push({
        minute: ev.minute ? String(ev.minute) : undefined,
        assist: ev.assist ? String(ev.assist) : undefined,
      })
    }
    if (ev.type === "goal" && ev.assist && nameMatchesPlayer(player, ev.assist)) {
      assistCount += 1
    }
    if (ev.type === "card" && nameMatchesPlayer(player, ev.cardPlayer)) {
      card = ev.cardType === "red" ? "red" : "yellow"
    }
    if (ev.type === "substitution") {
      if (nameMatchesPlayer(player, ev.playerIn)) {
        substitutions.push({
          direction: "in",
          partner: String(ev.playerOut ?? "—"),
          minute: ev.minute ? String(ev.minute) : undefined,
        })
      }
      if (nameMatchesPlayer(player, ev.playerOut)) {
        substitutions.push({
          direction: "out",
          partner: String(ev.playerIn ?? "—"),
          minute: ev.minute ? String(ev.minute) : undefined,
        })
      }
    }
  }

  return { goals, assistCount, card, substitutions }
}

/**
 * @param {{ minute?: string, partner: string, direction: "in" | "out" }} sub
 */
function substitutionLabel(sub) {
  const partner = surnameFromText(sub.partner)
  const time = sub.minute ? ` ${sub.minute}` : ""
  if (sub.direction === "in") {
    return `↑${time} · for ${partner}`
  }
  return `↓${time} · ${partner} in`
}

/**
 * @param {{
 *   number?: number | null
 *   color: string
 *   goalkeeper?: boolean
 *   compact?: boolean
 * }} props
 */
const PIN_TEXT_SHADOW = "0 1px 3px #000, 0 0 8px rgba(0,0,0,0.85)"

function JerseyIcon({ number, color, goalkeeper = false, compact = false }) {
  const w = compact ? 30 : 36
  const h = compact ? 34 : 40
  const fill = goalkeeper ? "#141414" : color
  const accent = goalkeeper ? "#3a3a3a" : "rgba(0,0,0,0.22)"

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 46"
      className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
      aria-hidden
    >
      <path
        d="M5 15 L11 9.5 L14.5 12 L25.5 12 L29 9.5 L35 15 L32 21 L34 44 H6 L8 21 Z"
        fill={fill}
        stroke={accent}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 12 Q20 15.5 25.5 12"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.7"
      />
      <path
        d="M5 15 L8 21 L6 26 M35 15 L32 21 L34 26"
        fill="none"
        stroke={accent}
        strokeWidth="0.6"
      />
      {number != null && (
        <text
          x="20"
          y="31"
          textAnchor="middle"
          fill="#fff"
          fontSize="12"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {number}
        </text>
      )}
    </svg>
  )
}

function PlayerPin({
  player,
  formationPlace,
  jerseyColor,
  subbedIn,
  subbedOut,
  goals,
  assistCount,
  substitutions,
  card,
  compact,
}) {
  const label = lineupLabel(player)
  const nameSize = compact ? "text-[10px] leading-tight" : "text-[11px] leading-tight"
  const subSize = compact ? "text-[9px] leading-tight" : "text-[10px] leading-tight"
  const badgeSize = compact ? "text-[10px]" : "text-[11px]"
  const isGk = formationPlace === 1
  const scored = goals.length > 0
  const goalTitle = goals
    .map((g) => {
      const parts = [g.minute, g.assist ? `A: ${surnameFromText(g.assist)}` : null].filter(
        Boolean,
      )
      return parts.join(" · ")
    })
    .join(" | ")

  return (
    <div className="flex max-w-[4.25rem] flex-col items-center">
      <div className="relative">
        <JerseyIcon
          number={player.number}
          color={jerseyColor}
          goalkeeper={isGk}
          compact={compact}
        />
        {scored && (
          <span
            className={`absolute -right-1.5 -top-1 ${badgeSize} drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
            title={goalTitle || "Goal"}
            aria-label={goalTitle || "Goal"}
          >
            ⚽{goals.length > 1 ? goals.length : ""}
          </span>
        )}
        {assistCount > 0 && (
          <span
            className={`absolute -bottom-1 -right-1.5 ${badgeSize} drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
            title={`${assistCount} assist${assistCount > 1 ? "s" : ""}`}
            aria-label={`${assistCount} assist${assistCount > 1 ? "s" : ""}`}
          >
            👟{assistCount > 1 ? assistCount : ""}
          </span>
        )}
        {card === "yellow" && (
          <span className="absolute -left-1 top-1 h-3 w-2 rounded-none bg-yellow-400 shadow ring-1 ring-black/30" />
        )}
        {card === "red" && (
          <span className="absolute -left-1 top-1 h-3 w-2 rounded-none bg-red-500 shadow ring-1 ring-black/30" />
        )}
      </div>
      <p
        className={`mt-0.5 max-w-full truncate text-center font-bold text-white ${nameSize}`}
        style={{ textShadow: PIN_TEXT_SHADOW }}
      >
        {label}
      </p>
      {substitutions.map((sub, i) => (
        <p
          key={`sub-${i}`}
          className={`max-w-full truncate text-center font-bold ${
            sub.direction === "in" ? "text-emerald-50" : "text-rose-100"
          } ${subSize}`}
          style={{ textShadow: PIN_TEXT_SHADOW }}
          title={substitutionLabel(sub)}
        >
          {sub.direction === "in" ? "↑" : "↓"}
          {sub.minute ? ` ${sub.minute}` : ""}
          {" · "}
          {surnameFromText(sub.partner)}
        </p>
      ))}
      {(subbedIn || subbedOut) && substitutions.length === 0 && (
        <p
          className={`max-w-full truncate text-center font-bold ${
            subbedIn ? "text-emerald-50" : "text-rose-100"
          } ${subSize}`}
          style={{ textShadow: PIN_TEXT_SHADOW }}
        >
          {subbedIn ? "↑" : "↓"}
        </p>
      )}
    </div>
  )
}

/**
 * @param {{
 *   entry: {
 *     player?: { number?: number | null, name?: string, shortName?: string }
 *     formationPlace?: number | null
 *     subbedIn?: boolean
 *     subbedOut?: boolean
 *   }
 *   jerseyColor: string
 *   keyEvents: unknown[]
 *   compact?: boolean
 * }} props
 */
function BenchPlayer({ entry, jerseyColor, keyEvents, homeAway, compact }) {
  const player = entry.player ?? { name: "?" }
  const events = playerMatchEvents(player, keyEventsForTeam(keyEvents, homeAway))

  return (
    <li className="flex min-w-0 items-center gap-1.5 rounded-md bg-zinc-900/50 px-1.5 py-1 ring-1 ring-white/5">
      <JerseyIcon
        number={player.number}
        color={jerseyColor}
        goalkeeper={entry.formationPlace === 1}
        compact
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold text-zinc-100">
          {player.number != null ? `${player.number} ` : ""}
          {lineupLabel(player)}
        </p>
        {events.goals.map((goal, i) => (
          <p key={i} className="truncate text-[10px] font-semibold text-emerald-300">
            ⚽{goal.minute ? ` ${goal.minute}` : ""}
            {goal.assist ? ` · A: ${surnameFromText(goal.assist)}` : ""}
          </p>
        ))}
        {events.assistCount > 0 && (
          <p className="text-[10px] font-semibold text-sky-300" title="Assist">
            👟{events.assistCount > 1 ? ` ×${events.assistCount}` : ""}
          </p>
        )}
        {events.substitutions.map((sub, i) => (
          <p
            key={i}
            className={`truncate text-[10px] font-semibold ${
              sub.direction === "in" ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {substitutionLabel(sub)}
          </p>
        ))}
        {entry.subbedIn && events.substitutions.length === 0 && (
          <p className="text-[10px] font-semibold text-emerald-300">↑ Subbed on</p>
        )}
      </div>
    </li>
  )
}

/**
 * @param {{
 *   teams: {
 *     team?: { name?: string, color?: string | null }
 *     homeAway?: string | null
 *     substitutes?: {
 *       player?: { number?: number | null, name?: string, shortName?: string }
 *       formationPlace?: number | null
 *       subbedIn?: boolean
 *     }[]
 *   }[]
 *   keyEvents: unknown[]
 *   compact?: boolean
 * }} props
 */
function SubstitutesBench({ teams, keyEvents, compact }) {
  const rows = teams.filter((t) => (t.substitutes?.length ?? 0) > 0)
  if (!rows.length) return null

  return (
    <div className="mt-2 border-t border-white/8 pt-2">
      <p className="mb-1.5 text-center text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
        Substitutes
      </p>
      <div
        className={`grid gap-2 ${rows.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}
      >
        {rows.map((row, i) => {
          const jerseyColor =
            toHexColor(row.team?.color) ??
            (row.homeAway === "away" ? DEFAULT_JERSEY.bottom : DEFAULT_JERSEY.top)
          return (
            <div key={row.team?.name ?? i} className="min-w-0">
              <p className="mb-1 truncate text-[8px] font-bold text-zinc-400">
                {row.team?.name ?? "Team"}
              </p>
              <ul className="max-h-24 space-y-1 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin] [scrollbar-color:rgb(63_63_70)_transparent]">
                {(row.substitutes ?? []).map((entry, j) => (
                  <BenchPlayer
                    key={entry.player?.name ?? j}
                    entry={entry}
                    jerseyColor={jerseyColor}
                    keyEvents={keyEvents}
                    homeAway={row.homeAway}
                    compact={compact}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * @param {{
 *   name: string
 *   formation?: string
 *   flagUrl?: string | null
 *   corner: "top-right" | "bottom-right"
 * }} props
 */
function PitchTeamLabel({ name, formation, flagUrl, corner }) {
  const cornerClass =
    corner === "top-right" ? "top-2 right-2 items-end" : "bottom-2 right-2 items-end"

  return (
    <div
      className={`pointer-events-none absolute ${cornerClass} z-20 flex max-w-[46%] flex-col gap-0.5 rounded-lg bg-black/50 px-2 py-1 text-right shadow-lg ring-1 ring-white/15 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-end gap-1.5">
        <span className="truncate text-[11px] font-bold leading-tight text-white">
          {name}
        </span>
        {flagUrl ? (
          <img
            src={flagUrl}
            alt=""
            className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/25"
            loading="lazy"
          />
        ) : null}
      </div>
      {formation ? (
        <span className="text-[9px] font-semibold text-white/75">{formation}</span>
      ) : null}
    </div>
  )
}

function PitchMarkings() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-white/28"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="0.6" fill="currentColor" />
      <rect x="22" y="2" width="56" height="16" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <rect x="36" y="2" width="28" height="6" fill="none" stroke="currentColor" strokeWidth="0.25" />
      <rect x="22" y="82" width="56" height="16" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <rect x="36" y="92" width="28" height="6" fill="none" stroke="currentColor" strokeWidth="0.25" />
      <circle cx="50" cy="12" r="0.5" fill="currentColor" />
      <circle cx="50" cy="88" r="0.5" fill="currentColor" />
    </svg>
  )
}

const DEFAULT_JERSEY = {
  top: "#1e4078",
  bottom: "#9b1b30",
}

/**
 * @param {{
 *   lineups: unknown[]
 *   keyEvents?: unknown[]
 *   loading?: boolean
 *   compact?: boolean
 *   className?: string
 *   teamFlags?: {
 *     home?: { code?: string | null, logoUrl?: string | null, flagUrl?: string | null }
 *     away?: { code?: string | null, logoUrl?: string | null, flagUrl?: string | null }
 *   }
 * }} props
 */
export function PitchLineup({
  lineups,
  keyEvents = [],
  loading = false,
  compact = false,
  className = "",
}) {
  const teams = Array.isArray(lineups) ? lineups : []
  const home = teams.find(
    (t) =>
      t &&
      typeof t === "object" &&
      /** @type {{ homeAway?: string }} */ (t).homeAway === "home",
  ) ?? teams[0]
  const away = teams.find(
    (t) =>
      t &&
      typeof t === "object" &&
      /** @type {{ homeAway?: string }} */ (t).homeAway === "away",
  ) ?? teams[1]

  const hasXi =
    teams.length > 0 &&
    teams.some((t) => {
      const xi = /** @type {{ startXI?: unknown[] }} */ (t).startXI
      return Array.isArray(xi) && xi.length > 0
    })

  const hasFormation =
    hasXi &&
    teams.some((t) => {
      const xi = /** @type {{ formationPlace?: number | null }[]} */ (
        /** @type {{ startXI?: unknown[] }} */ (t).startXI
      )
      return Array.isArray(xi) && xi.some((p) => p?.formationPlace != null)
    })

  /** @param {unknown} teamRow @param {"top" | "bottom"} half */
  function renderTeam(teamRow, half) {
    if (!teamRow || typeof teamRow !== "object") return null
    const row = /** @type {{
      team?: { name?: string, color?: string | null }
      homeAway?: string | null
      formation?: string
      startXI?: {
        player?: { id?: string, name?: string, shortName?: string, number?: number | null }
        formationPlace?: number | null
        subbedIn?: boolean
        subbedOut?: boolean
      }[]
      substitutes?: {
        player?: { id?: string, name?: string, shortName?: string, number?: number | null }
        formationPlace?: number | null
        subbedIn?: boolean
        subbedOut?: boolean
      }[]
    }} */ (teamRow)
    const xi = row.startXI ?? []
    if (!xi.length) return null

    const positions = layoutFormationPlayers(xi, half, row.formation)
    const jerseyColor =
      toHexColor(row.team?.color) ??
      (half === "top" ? DEFAULT_JERSEY.top : DEFAULT_JERSEY.bottom)
    const teamEvents = keyEventsForTeam(keyEvents, row.homeAway)

    return xi.map((entry, i) => {
      const pos = positions[i] ?? { x: 50, y: half === "top" ? 25 : 75 }
      const pid = entry.player?.id ?? entry.player?.name ?? String(i)
      const evBadges = entry.player
        ? playerMatchEvents(entry.player, teamEvents)
        : { goals: [], assistCount: 0, card: null, substitutions: [] }
      return (
        <div
          key={`${half}-${pid}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            zIndex: Math.round(pos.y),
          }}
        >
          <PlayerPin
            player={entry.player ?? { name: "?" }}
            formationPlace={entry.formationPlace}
            jerseyColor={jerseyColor}
            subbedIn={entry.subbedIn}
            subbedOut={entry.subbedOut}
            goals={evBadges.goals}
            assistCount={evBadges.assistCount}
            substitutions={evBadges.substitutions}
            card={evBadges.card}
            compact={compact}
          />
        </div>
      )
    })
  }

  const height = compact ? "min-h-[560px]" : "min-h-[620px]"

  return (
    <div className={className}>
      {hasXi && (
        <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Lineups
        </p>
      )}

      {loading && !hasXi ? (
        <p className="py-8 text-center text-[11px] text-zinc-600">Loading line-ups…</p>
      ) : hasXi && hasFormation ? (
        <>
          <div
            className={`relative ${height} w-full overflow-hidden rounded-xl shadow-inner ring-1 ring-emerald-950/50`}
            style={{
              background:
                "linear-gradient(180deg, #1a6b38 0%, #22884a 18%, #259650 50%, #22884a 82%, #1a6b38 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, transparent, transparent 9%, rgba(0,0,0,0.07) 9%, rgba(0,0,0,0.07) 10%)",
              }}
              aria-hidden
            />
            <PitchMarkings />
            {home ? (
              <PitchTeamLabel
                name={
                  /** @type {{ team?: { name?: string } }} */ (home).team?.name ?? "Home"
                }
                formation={
                  /** @type {{ formation?: string }} */ (home).formation
                }
                flagUrl={
                  /** @type {{ team?: { flagUrl?: string | null } }} */ (home).team
                    ?.flagUrl
                }
                corner="top-right"
              />
            ) : null}
            {away ? (
              <PitchTeamLabel
                name={
                  /** @type {{ team?: { name?: string } }} */ (away).team?.name ?? "Away"
                }
                formation={
                  /** @type {{ formation?: string }} */ (away).formation
                }
                flagUrl={
                  /** @type {{ team?: { flagUrl?: string | null } }} */ (away).team
                    ?.flagUrl
                }
                corner="bottom-right"
              />
            ) : null}
            {renderTeam(home, "top")}
            {renderTeam(away, "bottom")}
          </div>
          <SubstitutesBench
            teams={[
              /** @type {{ team?: { name?: string, color?: string | null }, homeAway?: string | null, substitutes?: unknown[] }} */ (
                home
              ),
              /** @type {{ team?: { name?: string, color?: string | null }, homeAway?: string | null, substitutes?: unknown[] }} */ (
                away
              ),
            ].filter(Boolean)}
            keyEvents={keyEvents}
            compact={compact}
          />
        </>
      ) : hasXi ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {teams.map((teamRow, i) => {
            const row = /** @type {{ team?: { name?: string, color?: string | null }, formation?: string, startXI?: { player?: { number?: number | null, name?: string, shortName?: string }, formationPlace?: number | null }[], substitutes?: { player?: { number?: number | null, name?: string, shortName?: string }, formationPlace?: number | null, subbedIn?: boolean }[] }} */ (
              teamRow
            )
            const jerseyColor =
              toHexColor(row.team?.color) ??
              (i === 0 ? DEFAULT_JERSEY.top : DEFAULT_JERSEY.bottom)
            return (
              <div
                key={i}
                className="rounded-lg bg-zinc-950/50 px-2 py-2 ring-1 ring-inset ring-white/6"
              >
                <p className="text-[10px] font-bold text-emerald-100/90">
                  {row.team?.name}
                  {row.formation ? (
                    <span className="ml-1 text-zinc-500">{row.formation}</span>
                  ) : null}
                </p>
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(row.startXI ?? []).map((entry, j) => (
                    <li key={j} className="flex flex-col items-center">
                      <JerseyIcon
                        number={entry.player?.number}
                        color={jerseyColor}
                        goalkeeper={entry.formationPlace === 1}
                        compact
                      />
                      <span className="mt-0.5 max-w-full truncate text-[8px] font-semibold text-zinc-300">
                        {entry.player ? lineupLabel(entry.player) : "?"}
                      </span>
                    </li>
                  ))}
                </ul>
                {(row.substitutes?.length ?? 0) > 0 && (
                  <div className="mt-2 border-t border-white/6 pt-2">
                    <p className="mb-1 text-[8px] font-semibold uppercase text-zinc-500">
                      Substitutes
                    </p>
                    <ul className="max-h-24 space-y-1 overflow-y-auto [scrollbar-width:thin]">
                      {row.substitutes.map((entry, j) => (
                        <BenchPlayer
                          key={j}
                          entry={entry}
                          jerseyColor={jerseyColor}
                          keyEvents={keyEvents}
                          homeAway={row.homeAway}
                          compact
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-4 text-center text-[11px] text-zinc-600">
          Line-up not published yet.
        </p>
      )}
    </div>
  )
}
