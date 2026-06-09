/**
 * @param {{ home: number, away: number }} props
 */
function CompareBars({ home, away }) {
  const total = home + away || 1
  const homePct = (home / total) * 100
  const awayPct = (away / total) * 100

  return (
    <div className="mt-1 flex gap-1">
      <div className="flex h-1 flex-1 justify-end overflow-hidden rounded-full bg-zinc-800/90">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${homePct}%` }}
        />
      </div>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800/90">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${awayPct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * @param {{ value: number, side: "home" | "away" }} props
 */
function ValueBadge({ value, side }) {
  const rounded = Number.isInteger(value) ? value : Math.round(value * 10) / 10
  const tone =
    side === "home"
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-violet-500/15 text-violet-300"

  return (
    <span
      className={`min-w-[1.75rem] rounded-md px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${tone}`}
    >
      {rounded}
    </span>
  )
}

/**
 * @param {{
 *   stats: {
 *     homeName: string
 *     awayName: string
 *     possession: { home: number, away: number } | null
 *     rows: { key: string, label: string, home: number, away: number }[]
 *   } | null
 *   loading?: boolean
 *   className?: string
 * }} props
 */
export function MatchStatsOverview({ stats, loading = false, className = "" }) {
  if (loading && !stats) {
    return (
      <p className={`py-6 text-center text-[11px] text-zinc-600 ${className}`}>
        Loading match stats…
      </p>
    )
  }

  if (!stats) {
    return (
      <p className={`py-6 text-center text-[11px] text-zinc-600 ${className}`}>
        Match stats not available yet.
      </p>
    )
  }

  const { possession, rows } = stats

  return (
    <div className={className}>
      <p className="mb-3 text-center text-[11px] font-semibold text-zinc-300">
        Match overview
      </p>

      {possession && (
        <div className="mb-4">
          <p className="mb-1.5 text-center text-[10px] text-zinc-500">
            Ball possession
          </p>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-bold text-emerald-300">
              {Math.round(possession.home)}%
            </span>
            <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-bold text-violet-300">
              {Math.round(possession.away)}%
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${possession.home}%` }}
            />
            <div
              className="bg-violet-500 transition-all"
              style={{ width: `${possession.away}%` }}
            />
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-center justify-between gap-2">
              <ValueBadge value={row.home} side="home" />
              <span className="min-w-0 flex-1 truncate text-center text-[10px] text-zinc-500">
                {row.label}
              </span>
              <ValueBadge value={row.away} side="away" />
            </div>
            <CompareBars home={row.home} away={row.away} />
          </li>
        ))}
      </ul>
    </div>
  )
}
