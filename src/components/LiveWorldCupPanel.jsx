import { flagUrl } from "../utils/flags.js"

function TeamBadge({ code, name }) {
  const src = flagUrl(code)
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {src ? (
        <img
          src={src}
          alt=""
          width={56}
          height={36}
          className="h-9 w-14 rounded object-cover shadow-lg ring-1 ring-black/40"
        />
      ) : (
        <span className="h-9 w-14 rounded bg-zinc-800 ring-1 ring-white/10" aria-hidden />
      )}
      <span className="text-sm font-bold text-zinc-100">{name}</span>
    </div>
  )
}

/**
 * @param {unknown[]} events
 */
function GoalEventsList({ events }) {
  const goals = events.filter((row) => {
    if (!row || typeof row !== "object") return false
    const type = /** @type {{ type?: string }} */ (row).type
    return type === "Goal"
  })

  if (!goals.length) {
    return (
      <p className="text-sm text-zinc-500">
        No goals yet — or event data not available from the API.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {goals.map((row, i) => {
        const o = /** @type {Record<string, unknown>} */ (row)
        const time = /** @type {{ elapsed?: number, extra?: number | null }} */ (
          o.time
        )
        const player = /** @type {{ name?: string }} */ (o.player)
        const assist = /** @type {{ name?: string } | null} */ (o.assist)
        const team = /** @type {{ name?: string }} */ (o.team)
        const detail = /** @type {string | undefined} */ (o.detail)
        const minute =
          time?.elapsed != null
            ? `${time.elapsed}${time.extra ? `+${time.extra}` : ""}'`
            : ""
        const scorer = player?.name ?? "Unknown"
        const assistName =
          assist && typeof assist === "object" && assist.name
            ? assist.name
            : null

        return (
          <li
            key={`${minute}-${scorer}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-zinc-900/70 px-3 py-2 ring-1 ring-inset ring-white/8"
          >
            <div className="min-w-0">
              <span className="font-semibold text-white">{scorer}</span>
              {assistName && (
                <span className="text-sm text-zinc-400">
                  {" "}
                  — assist: {assistName}
                </span>
              )}
              {detail && detail !== "Normal Goal" && (
                <span className="ml-1 text-xs text-zinc-500">({detail})</span>
              )}
            </div>
            <div className="shrink-0 text-right text-xs text-zinc-500">
              {team?.name && <span className="mr-2">{team.name}</span>}
              {minute && (
                <span className="font-mono font-semibold text-emerald-400/90">
                  {minute}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * @param {unknown} lineupRow
 */
function SquadColumn({ lineupRow }) {
  if (!lineupRow || typeof lineupRow !== "object") return null
  const o = /** @type {Record<string, unknown>} */ (lineupRow)
  const team = /** @type {{ name?: string }} */ (o.team)
  const formation = /** @type {string | undefined} */ (o.formation)
  const startXI = /** @type {unknown[] | undefined} */ (o.startXI)
  const subs = /** @type {unknown[] | undefined} */ (o.substitutes)

  /** @param {unknown} entry */
  function playerLine(entry) {
    if (!entry || typeof entry !== "object") return null
    const p = /** @type {{ player?: { name?: string, number?: number } }} */ (
      entry
    ).player
    if (!p?.name) return null
    const num = p.number != null ? `${p.number}. ` : ""
    return `${num}${p.name}`
  }

  return (
    <div className="min-w-0 flex-1 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-inset ring-white/8">
      <h4 className="text-sm font-bold text-emerald-100/95">
        {team?.name ?? "Team"}
        {formation ? (
          <span className="ml-2 text-xs font-medium text-zinc-500">
            {formation}
          </span>
        ) : null}
      </h4>
      {Array.isArray(startXI) && startXI.length > 0 ? (
        <>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Starting XI
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-zinc-300">
            {startXI.map((entry, i) => {
              const line = playerLine(entry)
              return line ? <li key={i}>{line}</li> : null
            })}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Line-up not published yet.</p>
      )}
      {Array.isArray(subs) && subs.length > 0 && (
        <>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Substitutes
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-zinc-500">
            {subs.map((entry, i) => {
              const line = playerLine(entry)
              return line ? <li key={i}>{line}</li> : null
            })}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * @param {{
 *   match: {
 *     fixtureId: number
 *     apiHome: string
 *     apiAway: string
 *     homeName: string
 *     awayName: string
 *     homeGoals: number | null
 *     awayGoals: number | null
 *     statusShort: string
 *     elapsed: number | null
 *   }
 *   events: unknown[]
 *   lineups: unknown[]
 *   detailLoading?: boolean
 *   detailError?: string | null
 * }} props
 */
export function LiveWorldCupPanel({
  match,
  events,
  lineups,
  detailLoading,
  detailError,
}) {
  const scoreText =
    typeof match.homeGoals === "number" && typeof match.awayGoals === "number"
      ? `${match.homeGoals} — ${match.awayGoals}`
      : "—"
  const timeBit =
    match.elapsed != null ? `${match.elapsed}'` : match.statusShort

  return (
    <section
      id="live-match"
      className="scroll-mt-24 rounded-2xl border border-rose-500/25 bg-linear-to-b from-rose-950/40 to-zinc-950/90 p-4 shadow-lg shadow-rose-950/20 ring-1 ring-rose-400/20 sm:p-5"
      aria-labelledby="live-match-heading"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
            aria-hidden
          />
          <h2
            id="live-match-heading"
            className="text-base font-bold text-white sm:text-lg"
          >
            Live World Cup match
          </h2>
        </div>
        <span className="rounded-md bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/30">
          {match.statusShort}
          {timeBit ? ` · ${timeBit}` : ""}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <TeamBadge code={match.apiHome} name={match.homeName} />
        <div className="shrink-0 text-center">
          <p className="text-3xl font-black tabular-nums tracking-tight text-white sm:text-4xl">
            {scoreText}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            Live score
          </p>
        </div>
        <TeamBadge code={match.apiAway} name={match.awayName} />
      </div>

      {detailLoading && (
        <p className="mt-4 text-center text-sm text-zinc-500">
          Loading goals &amp; squads…
        </p>
      )}

      {detailError && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          {detailError}
        </p>
      )}

      {!detailLoading && (
        <>
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Goals &amp; assists
            </h3>
            <GoalEventsList events={events} />
          </div>

          {lineups.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Squads
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                {lineups.map((row, i) => (
                  <SquadColumn key={i} lineupRow={row} />
                ))}
              </div>
            </div>
          )}

          {!detailLoading && lineups.length === 0 && !detailError && (
            <p className="mt-4 text-sm text-zinc-500">
              Squad lists are not available yet for this fixture (API may publish
              them closer to kick-off).
            </p>
          )}
        </>
      )}
    </section>
  )
}
