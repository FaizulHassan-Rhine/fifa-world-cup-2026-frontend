import { useMemo } from "react"
import { DateTime } from "luxon"
import { flagUrl } from "../utils/flags.js"
import { ALL_FOOTBALL_CARD_CHROME } from "../utils/matchCardChrome.js"
import { MatchCardBodyTabs } from "./MatchCardBodyTabs.jsx"
import { MatchCardShell } from "./MatchCardShell.jsx"
import { MatchScoreCenter } from "./MatchScoreCenter.jsx"

/**
 * @param {{ logoUrl?: string | null, code?: string, name: string, align: "start" | "end" }} props
 */
function TeamFace({ logoUrl, code, name, align }) {
  const src = logoUrl || (code ? flagUrl(code) : null)
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
        align === "end" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={56}
          height={36}
          className="h-8 w-12 shrink-0 rounded-md object-cover shadow-lg ring-1 ring-black/50 sm:h-9 sm:w-14"
          loading="lazy"
        />
      ) : (
        <span
          className="h-8 w-12 shrink-0 rounded-md bg-zinc-800 ring-1 ring-white/10 sm:h-9 sm:w-14"
          aria-hidden
        />
      )}
      <span className="line-clamp-2 text-[11px] font-bold leading-tight text-zinc-100 sm:text-xs">
        {name}
      </span>
    </div>
  )
}

/**
 * @param {{
 *   match: {
 *     fixtureId: number
 *     leagueLabel?: string
 *     homeName: string
 *     awayName: string
 *     apiHome?: string
 *     apiAway?: string
 *     homeLogo?: string | null
 *     awayLogo?: string | null
 *     homeGoals: number | null
 *     awayGoals: number | null
 *     statusShort: string
 *     elapsed: number | null
 *     kickoffIso?: string | null
 *     venueName?: string | null
 *     venueCity?: string | null
 *   }
 *   lineups?: unknown[]
 *   keyEvents?: unknown[]
 *   commentary?: import("../utils/normalizeEspnCommentary.js").ReturnType<import("../utils/normalizeEspnCommentary.js").normalizeEspnCommentary>
 *   stats?: import("../utils/normalizeEspnMatchStats.js").ReturnType<import("../utils/normalizeEspnMatchStats.js").normalizeEspnBoxscoreStats> | null
 *   lineupsLoading?: boolean
 * }} props
 */
export function GlobalMatchCard({
  match,
  lineups = [],
  keyEvents = [],
  commentary = [],
  stats = null,
  lineupsLoading = false,
}) {
  const isLive = ["LIVE", "1H", "2H", "HT", "ET", "P"].includes(match.statusShort)
  const kickoff = match.kickoffIso
    ? DateTime.fromISO(match.kickoffIso, { setZone: true })
    : null
  const kickoffLocal = kickoff?.isValid
    ? kickoff.toLocal().toFormat("ccc, d MMM · HH:mm")
    : null

  const defaultTab = useMemo(() => {
    const hasEvents = keyEvents.some(
      (e) =>
        e &&
        typeof e === "object" &&
        /** @type {{ type?: string }} */ (e).type !== "divider",
    )
    return hasEvents ? "details" : "lineups"
  }, [keyEvents])

  const chrome = ALL_FOOTBALL_CARD_CHROME

  return (
    <MatchCardShell chrome={chrome} className="h-full hover:-translate-y-0.5">
      <header
        className={`relative flex items-center justify-between gap-2 border-b px-3 py-2 ${chrome.header}`}
      >
        <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {match.leagueLabel ?? "Football"}
        </span>
        {isLive ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-200 ring-1 ring-rose-400/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
            Live
          </span>
        ) : match.statusShort === "FT" ? (
          <span className="rounded-md bg-zinc-700/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
            FT
          </span>
        ) : (
          <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
            Upcoming
          </span>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <TeamFace
            logoUrl={match.homeLogo}
            code={match.apiHome}
            name={match.homeName}
            align="start"
          />
          <MatchScoreCenter
            homeGoals={match.homeGoals}
            awayGoals={match.awayGoals}
            statusShort={match.statusShort}
            elapsed={match.elapsed}
            elapsedDisplay={match.elapsedDisplay}
            kickoffIso={match.kickoffIso}
            kickoffDt={kickoff}
            size="md"
          />
          <TeamFace
            logoUrl={match.awayLogo}
            code={match.apiAway}
            name={match.awayName}
            align="end"
          />
        </div>

        {kickoffLocal && match.statusShort !== "FT" && !isLive && (
          <p className="text-center text-[10px] text-zinc-500">{kickoffLocal}</p>
        )}

        <MatchCardBodyTabs
          key={`${match.fixtureId}-${defaultTab}`}
          lineups={lineups}
          keyEvents={keyEvents}
          commentary={commentary}
          stats={stats}
          loading={lineupsLoading}
          defaultTab={defaultTab}
          teamFlags={{
            home: {
              code: match.apiHome,
              logoUrl: match.homeLogo,
              flagUrl: match.homeLogo ?? flagUrl(match.apiHome),
            },
            away: {
              code: match.apiAway,
              logoUrl: match.awayLogo,
              flagUrl: match.awayLogo ?? flagUrl(match.apiAway),
            },
          }}
        />

        {(match.venueName || match.venueCity) && (
          <p className="mt-auto truncate text-center text-[10px] text-zinc-600">
            {[match.venueName, match.venueCity].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </MatchCardShell>
  )
}
