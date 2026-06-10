import { LIVE_MATCH_STATUSES } from "../utils/mergeLiveFixtures.js"
import { useKickoffCountdown } from "../hooks/useKickoffCountdown.js"

/**
 * @param {{
 *   homeGoals?: number | null
 *   awayGoals?: number | null
 *   statusShort?: string
 *   elapsed?: number | null
 *   elapsedDisplay?: string | null
 *   kickoffIso?: string | null
 *   kickoffDt?: import("luxon").DateTime | null
 *   size?: "sm" | "md" | "lg"
 * }} props
 */
export function MatchScoreCenter({
  homeGoals,
  awayGoals,
  statusShort = "NS",
  elapsed,
  elapsedDisplay = null,
  kickoffIso,
  kickoffDt,
  size = "md",
}) {
  const countdown = useKickoffCountdown(kickoffIso, kickoffDt)
  const isLive = LIVE_MATCH_STATUSES.has(statusShort)
  const isFt = statusShort === "FT"
  const isUpcoming = !isLive && !isFt

  const hasScore =
    typeof homeGoals === "number" && typeof awayGoals === "number"

  const showNumericScore = isLive || isFt || hasScore || isUpcoming

  const scoreText = showNumericScore
    ? `${hasScore ? homeGoals : 0} – ${hasScore ? awayGoals : 0}`
    : null

  const scoreSize =
    size === "lg"
      ? "text-3xl sm:text-4xl"
      : size === "sm"
        ? "text-xl"
        : "text-xl sm:text-2xl"

  let timeLabel = ""
  let timeClass = "text-zinc-500"

  if (isLive) {
    if (statusShort === "HT") {
      timeLabel = "Halftime"
      timeClass = "text-amber-400"
    } else if (statusShort === "P") {
      timeLabel = "Penalties"
      timeClass = "text-violet-400"
    } else if (elapsedDisplay || elapsed != null) {
      timeLabel = elapsedDisplay ?? `${elapsed}'`
      timeClass = "text-emerald-400"
    } else {
      timeLabel = "Live"
      timeClass = "text-rose-400"
    }
  } else if (isFt) {
    timeLabel = "Full time"
    timeClass = "text-zinc-400"
  } else if (isUpcoming) {
    timeLabel = countdown.label
    timeClass = "text-emerald-400/90"
  }

  return (
    <div className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 px-0.5 sm:w-auto sm:gap-1 sm:px-1">
      {scoreText ? (
        <span
          className={`font-black tabular-nums tracking-tight text-white ${scoreSize}`}
        >
          {scoreText}
        </span>
      ) : (
        <span className="rounded-full border border-zinc-600/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
          vs
        </span>
      )}

      {isLive && (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/30">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
          Live
        </span>
      )}

      {timeLabel && (
        <span
          className={`max-w-full truncate text-center text-[9px] font-semibold tabular-nums sm:text-[10px] ${timeClass}`}
        >
          {timeLabel}
        </span>
      )}
    </div>
  )
}
