/**
 * @param {unknown} entry
 */
function playerLine(entry) {
  if (!entry || typeof entry !== "object") return null
  const p = /** @type {{ player?: { name?: string, number?: number | null } }} */ (
    entry
  ).player
  if (!p?.name) return null
  const num = p.number != null ? `${p.number}. ` : ""
  return `${num}${p.name}`
}

/**
 * @param {unknown} lineupRow
 */
function SquadColumn({ lineupRow, compact }) {
  if (!lineupRow || typeof lineupRow !== "object") return null
  const o = /** @type {Record<string, unknown>} */ (lineupRow)
  const team = /** @type {{ name?: string }} */ (o.team)
  const formation = /** @type {string | undefined} */ (o.formation)
  const startXI = /** @type {unknown[]} */ (o.startXI)

  if (!Array.isArray(startXI) || startXI.length === 0) return null

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[10px] font-bold text-emerald-100/90">
        {team?.name ?? "Team"}
        {formation ? (
          <span className="ml-1 font-medium text-zinc-500">{formation}</span>
        ) : null}
      </p>
      <ul
        className={`mt-1 space-y-px text-[10px] text-zinc-400 ${
          compact ? "max-h-28 overflow-y-auto pr-0.5" : ""
        }`}
      >
        {startXI.map((entry, i) => {
          const line = playerLine(entry)
          return line ? <li key={i}>{line}</li> : null
        })}
      </ul>
    </div>
  )
}

/**
 * @param {{
 *   lineups: unknown[]
 *   loading?: boolean
 *   compact?: boolean
 *   className?: string
 * }} props
 */
export function StartingXiBlock({
  lineups,
  loading = false,
  compact = true,
  className = "",
}) {
  const hasXi =
    Array.isArray(lineups) &&
    lineups.some((row) => {
      if (!row || typeof row !== "object") return false
      const startXI = /** @type {{ startXI?: unknown[] }} */ (row).startXI
      return Array.isArray(startXI) && startXI.length > 0
    })

  return (
    <div
      className={`rounded-lg bg-zinc-950/50 px-2.5 py-2 ring-1 ring-inset ring-white/6 ${className}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        Starting XI
      </p>

      {loading && !hasXi ? (
        <p className="mt-1.5 text-[10px] text-zinc-600">Loading squads…</p>
      ) : hasXi ? (
        <div className={`mt-1.5 flex gap-2 ${compact ? "flex-col sm:flex-row" : "flex-col sm:flex-row"}`}>
          {lineups.map((row, i) => (
            <SquadColumn key={i} lineupRow={row} compact={compact} />
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-[10px] text-zinc-600">
          Line-up not published yet.
        </p>
      )}
    </div>
  )
}
