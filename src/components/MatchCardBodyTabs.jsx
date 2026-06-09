import { useState } from "react"
import { MatchCommentary } from "./MatchCommentary.jsx"
import { MatchEventTimeline } from "./MatchEventTimeline.jsx"
import { MatchStatsOverview } from "./MatchStatsOverview.jsx"
import { PitchLineup } from "./PitchLineup.jsx"

/** @typedef {"details" | "commentary" | "lineups" | "stats"} MatchCardTab */

/**
 * @param {{
 *   lineups: unknown[]
 *   keyEvents: unknown[]
 *   commentary?: { id: number, minute: string, text: string, kind: string, isKey: boolean }[]
 *   stats?: import("../utils/normalizeEspnMatchStats.js").ReturnType<import("../utils/normalizeEspnMatchStats.js").normalizeEspnBoxscoreStats> | null
 *   loading?: boolean
 *   compact?: boolean
 *   defaultTab?: MatchCardTab
 *   teamFlags?: {
 *     home?: { code?: string | null, logoUrl?: string | null, flagUrl?: string | null }
 *     away?: { code?: string | null, logoUrl?: string | null, flagUrl?: string | null }
 *   }
 * }} props
 */
export function MatchCardBodyTabs({
  lineups,
  keyEvents,
  commentary = [],
  stats = null,
  loading = false,
  compact = true,
  defaultTab = "details",
  teamFlags = null,
}) {
  const [tab, setTab] = useState(/** @type {MatchCardTab} */ (defaultTab))

  const tabs = [
    { id: /** @type {const} */ ("details"), label: "Details" },
    { id: /** @type {const} */ ("commentary"), label: "Commentary" },
    { id: /** @type {const} */ ("lineups"), label: "Lineups" },
    { id: /** @type {const} */ ("stats"), label: "Stats" },
  ]

  const scrollClass =
    "max-h-64 overflow-y-auto overscroll-contain rounded-lg ring-1 ring-zinc-800/80 [scrollbar-width:thin] [scrollbar-color:rgb(63_63_70)_transparent]"

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        className="flex gap-0.5 rounded-lg bg-zinc-900/70 p-1 ring-1 ring-inset ring-white/6"
        role="tablist"
        aria-label="Match details"
      >
        {tabs.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={(e) => {
                e.stopPropagation()
                setTab(t.id)
              }}
              className={`flex-1 rounded-md px-1 py-1.5 text-[9px] font-semibold transition sm:text-[10px] ${
                active
                  ? "bg-zinc-800 text-white ring-1 ring-white/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "details" ? (
          <div className={scrollClass}>
            <MatchEventTimeline
              events={keyEvents}
              loading={loading}
              className="p-1"
            />
          </div>
        ) : tab === "commentary" ? (
          <div className={scrollClass}>
            <MatchCommentary
              commentary={commentary}
              loading={loading}
              className="p-1"
            />
          </div>
        ) : tab === "lineups" ? (
          <div className={`${scrollClass} max-h-76`}>
            <PitchLineup
              lineups={lineups}
              keyEvents={keyEvents}
              loading={loading}
              compact={compact}
              teamFlags={teamFlags}
              className="px-0.5 pb-1"
            />
          </div>
        ) : (
          <div className={scrollClass}>
            <MatchStatsOverview stats={stats} loading={loading} className="p-2" />
          </div>
        )}
      </div>
    </div>
  )
}
