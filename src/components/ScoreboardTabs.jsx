/** @typedef {"live" | "results" | "upcoming"} ScoreboardTab */

/**
 * @param {{
 *   active: ScoreboardTab
 *   onChange: (tab: ScoreboardTab) => void
 *   counts: { live: number, results: number, upcoming: number }
 *   lastUpdated: Date | null
 *   pollSeconds?: number
 *   loading?: boolean
 * }} props
 */
export function ScoreboardTabs({
  active,
  onChange,
  counts,
  lastUpdated,
  pollSeconds = 5,
  loading = false,
}) {
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : loading
      ? "Loading…"
      : "—"

  /** @type {{ id: ScoreboardTab, label: string, count: number, icon: import("react").ReactNode, badgeClass: string }[]} */
  const tabs = [
    {
      id: "live",
      label: "Live",
      count: counts.live,
      badgeClass:
        active === "live"
          ? "bg-rose-500/30 text-rose-100"
          : "bg-zinc-800 text-zinc-400",
      icon: (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
          aria-hidden
        />
      ),
    },
    {
      id: "results",
      label: "Results",
      count: counts.results,
      badgeClass:
        active === "results"
          ? "bg-emerald-500/25 text-emerald-100"
          : "bg-zinc-800 text-zinc-400",
      icon: (
        <svg
          className="h-3.5 w-3.5 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "upcoming",
      label: "Upcoming",
      count: counts.upcoming,
      badgeClass:
        active === "upcoming"
          ? "bg-emerald-500 text-emerald-950"
          : "bg-emerald-600/80 text-emerald-50",
      icon: (
        <svg
          className="h-3.5 w-3.5 text-zinc-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:items-end">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-zinc-500 sm:justify-end sm:text-[10px]">
        <span className="min-w-0 break-words">Updated: {updatedLabel}</span>
        <span className="hidden text-zinc-600 sm:inline">·</span>
        <span className="inline-flex items-center gap-1">
          {loading && (
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden
            />
          )}
          Auto-refresh {pollSeconds}s
        </span>
      </div>

      <div
        className="w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] sm:w-auto"
        role="tablist"
        aria-label="Match scoreboard"
      >
        <div className="inline-flex min-w-full items-center gap-0.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-1 shadow-lg shadow-black/20 sm:min-w-0">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition sm:gap-2 sm:px-3 sm:text-xs ${
                isActive
                  ? "bg-zinc-800/90 text-white ring-1 ring-white/10"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${tab.badgeClass}`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
