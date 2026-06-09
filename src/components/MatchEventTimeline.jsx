/**
 * @param {{ type: string, minute?: string, side?: string, homeScore?: number, awayScore?: number, scorer?: string, assist?: string, playerIn?: string, playerOut?: string, cardPlayer?: string, cardType?: string, label?: string }} item
 */
function TimelineRow({ item }) {
  if (item.type === "divider") {
    return (
      <div className="relative my-3 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-700/80" />
        <span className="relative rounded-full bg-zinc-800 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-zinc-700">
          {item.label}
        </span>
      </div>
    )
  }

  const isHome = item.side === "home"
  const isAway = item.side === "away"

  const content =
    item.type === "goal" ? (
      <div className={`flex flex-wrap items-center gap-1.5 ${isAway ? "flex-row-reverse" : ""}`}>
        <span className="text-sm" aria-hidden>
          ⚽
        </span>
        <span className="rounded-md border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-indigo-100">
          {item.homeScore} – {item.awayScore}
        </span>
        <span className="text-xs font-bold text-white">{item.scorer}</span>
        {item.assist && (
          <span className="text-xs text-zinc-500">{item.assist}</span>
        )}
      </div>
    ) : item.type === "substitution" ? (
      <div className={`flex flex-wrap items-center gap-1.5 text-xs ${isAway ? "flex-row-reverse" : ""}`}>
        <span className="text-[10px] text-emerald-400" aria-hidden>
          ↑
        </span>
        <span className="text-[10px] text-rose-400" aria-hidden>
          ↓
        </span>
        <span className="font-bold text-white">{item.playerIn}</span>
        <span className="text-zinc-500">{item.playerOut}</span>
      </div>
    ) : item.type === "card" ? (
      <div className={`flex items-center gap-1.5 text-xs ${isAway ? "flex-row-reverse" : ""}`}>
        <span
          className={`h-3.5 w-2 rounded-sm ${item.cardType === "red" ? "bg-red-500" : "bg-yellow-400"}`}
        />
        <span className="font-bold text-white">{item.cardPlayer}</span>
      </div>
    ) : null

  if (!content) return null

  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-1 border-b border-zinc-800/60 py-2.5 ${
        isHome ? "bg-zinc-900/20" : isAway ? "bg-zinc-900/10" : ""
      }`}
    >
      <div className={`min-w-0 px-1 ${isHome ? "text-right" : ""}`}>
        {isHome ? content : null}
      </div>
      <div className="text-center text-[11px] font-bold tabular-nums text-zinc-500">
        {item.minute}
      </div>
      <div className={`min-w-0 px-1 ${isAway ? "text-right" : ""}`}>
        {isAway ? content : null}
      </div>
    </div>
  )
}

/**
 * @param {{ events: unknown[], loading?: boolean, className?: string }} props
 */
export function MatchEventTimeline({ events, loading = false, className = "" }) {
  const rows = Array.isArray(events) ? events : []
  const hasEvents = rows.some(
    (e) => e && typeof e === "object" && /** @type {{ type?: string }} */ (e).type !== "divider",
  )

  return (
    <div className={className}>
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        Match timeline
      </p>
      {loading && !rows.length ? (
        <p className="text-[11px] text-zinc-600">Loading events…</p>
      ) : rows.length > 0 ? (
        <div className="overflow-hidden rounded-xl ring-1 ring-zinc-800/80">
          {rows.map((item, i) => (
            <TimelineRow
              key={i}
              item={/** @type {Parameters<typeof TimelineRow>[0]["item"]} */ (item)}
            />
          ))}
        </div>
      ) : !hasEvents ? (
        <p className="text-[11px] text-zinc-600">No match events yet.</p>
      ) : null}
    </div>
  )
}
