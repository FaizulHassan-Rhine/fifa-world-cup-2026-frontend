import { useMemo } from "react"
import { STADIUMS } from "../data/stadiums.js"
import { flagUrl } from "../utils/flags.js"
import {
  formatMatchDate,
  formatMatchTime,
  parseKickoffEt,
} from "../utils/timeFormat.js"
import { PHASE_CARD_CHROME } from "../utils/matchCardChrome.js"
import { MatchCardBodyTabs } from "./MatchCardBodyTabs.jsx"
import { MatchCardShell } from "./MatchCardShell.jsx"
import { MatchScoreCenter } from "./MatchScoreCenter.jsx"

function PinIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function TeamFace({ team, align }) {
  const src = flagUrl(team.code)
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2 ${
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
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      ) : (
        <span
          className="h-8 w-12 shrink-0 rounded-md bg-linear-to-br from-zinc-700 to-zinc-800 ring-1 ring-white/10 sm:h-9 sm:w-14"
          aria-hidden
        />
      )}
      <span className="line-clamp-2 text-[11px] font-bold leading-tight text-zinc-100 sm:text-xs">
        {team.name}
      </span>
    </div>
  )
}

const phaseTheme = {
  group: {
    bar: "from-emerald-400/90 via-emerald-300/50 to-transparent",
    glow: "shadow-emerald-500/10 group-hover:shadow-emerald-500/15",
    chip: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25",
    vs: "border-emerald-500/30 bg-emerald-950/90 text-emerald-200/95 ring-1 ring-emerald-400/20",
    timeRing: "ring-emerald-500/15",
  },
  r32: {
    bar: "from-lime-400/90 via-lime-300/40 to-transparent",
    glow: "shadow-lime-500/10 group-hover:shadow-lime-500/15",
    chip: "bg-lime-500/12 text-lime-100 ring-lime-400/20",
    vs: "border-lime-500/30 bg-lime-950/90 text-lime-100 ring-1 ring-lime-400/15",
    timeRing: "ring-lime-400/15",
  },
  r16: {
    bar: "from-sky-400/90 via-sky-300/45 to-transparent",
    glow: "shadow-sky-500/10 group-hover:shadow-sky-500/15",
    chip: "bg-sky-500/15 text-sky-100 ring-sky-400/25",
    vs: "border-sky-500/35 bg-sky-950/90 text-sky-100 ring-1 ring-sky-400/20",
    timeRing: "ring-sky-400/20",
  },
  qf: {
    bar: "from-rose-400/90 via-rose-400/35 to-transparent",
    glow: "shadow-rose-500/10 group-hover:shadow-rose-500/15",
    chip: "bg-rose-500/15 text-rose-100 ring-rose-400/25",
    vs: "border-rose-500/35 bg-rose-950/90 text-rose-100 ring-1 ring-rose-400/20",
    timeRing: "ring-rose-400/20",
  },
  sf: {
    bar: "from-teal-400/90 via-teal-300/40 to-transparent",
    glow: "shadow-teal-500/10 group-hover:shadow-teal-500/15",
    chip: "bg-teal-500/15 text-teal-100 ring-teal-400/25",
    vs: "border-teal-500/35 bg-teal-950/90 text-teal-100 ring-1 ring-teal-400/20",
    timeRing: "ring-teal-400/20",
  },
  tp: {
    bar: "from-amber-400/90 via-amber-300/40 to-transparent",
    glow: "shadow-amber-500/10 group-hover:shadow-amber-500/15",
    chip: "bg-amber-500/15 text-amber-100 ring-amber-400/25",
    vs: "border-amber-500/35 bg-amber-950/90 text-amber-100 ring-1 ring-amber-400/20",
    timeRing: "ring-amber-400/20",
  },
  final: {
    bar: "from-indigo-400/90 via-violet-400/40 to-transparent",
    glow: "shadow-indigo-500/10 group-hover:shadow-indigo-500/15",
    chip: "bg-indigo-500/15 text-indigo-100 ring-indigo-400/25",
    vs: "border-indigo-500/35 bg-indigo-950/90 text-indigo-100 ring-1 ring-indigo-400/20",
    timeRing: "ring-indigo-400/20",
  },
}

function ScheduleBlock({ dt, venueTz, venueCity, theme }) {
  const localDate = formatMatchDate(dt, venueTz)
  const localTime = formatMatchTime(dt, venueTz)
  const bdtDate = formatMatchDate(dt, "Asia/Dhaka")
  const bdtTime = formatMatchTime(dt, "Asia/Dhaka")
  const sameCalendarDay = localDate === bdtDate

  return (
    <div
      className={`rounded-xl bg-zinc-950/55 ring-1 ring-inset ${theme.timeRing} ring-white/5`}
    >
      <p className="border-b border-white/6 px-3 py-2 text-center text-[11px] font-semibold text-zinc-300 sm:text-xs">
        {localDate}
      </p>
      <div className="grid grid-cols-2 divide-x divide-white/6">
        <div className="px-2.5 py-2.5 text-center sm:px-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            Local
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-white sm:text-xl">
            {localTime}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500">
            {venueCity} time
          </p>
        </div>
        <div className="bg-amber-950/25 px-2.5 py-2.5 text-center sm:px-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-500/90">
            BDT
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-50 sm:text-xl">
            {bdtTime}
          </p>
          {!sameCalendarDay ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-amber-200/70">
              {bdtDate}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] text-amber-200/50">Bangladesh</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function MatchCard({
  match,
  live,
  onClick,
  lineups = [],
  keyEvents = [],
  commentary = [],
  stats = null,
  lineupsLoading = false,
}) {
  const venue = STADIUMS[match.venueKey]
  const dt = parseKickoffEt(match.kickoffEt)
  const theme = phaseTheme[match.phase] || phaseTheme.group
  const chrome = PHASE_CARD_CHROME[match.phase] || PHASE_CARD_CHROME.group
  const interactive = typeof onClick === "function"
  const defaultTab = useMemo(() => {
    const hasEvents = keyEvents.some(
      (e) =>
        e &&
        typeof e === "object" &&
        /** @type {{ type?: string }} */ (e).type !== "divider",
    )
    return hasEvents ? "details" : "lineups"
  }, [keyEvents])

  return (
    <MatchCardShell
      chrome={chrome}
      className={`group h-full hover:-translate-y-0.5 ${theme.glow}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      articleClassName={
        interactive
          ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/80"
          : ""
      }
    >
      <header
        className={`relative flex shrink-0 items-start justify-between gap-2 border-b px-3 py-2.5 sm:px-3.5 sm:py-3 ${chrome.header}`}
      >
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tabular-nums tracking-wide ring-1 ring-inset sm:text-[11px] ${theme.chip}`}
        >
          #{match.matchNumber}
          {match.group ? (
            <span className="ml-1.5 font-semibold opacity-80">
              · Group {match.group}
            </span>
          ) : null}
        </span>
        {match.label && match.phase !== "group" && (
          <p className="max-w-[50%] text-right text-[9px] font-medium leading-snug text-zinc-500 sm:text-[10px]">
            {match.label}
          </p>
        )}
      </header>

      <div className="relative flex flex-1 flex-col gap-3 px-3 py-3 sm:gap-3.5 sm:px-3.5 sm:pb-3.5">
        {/* Teams face-off — flags side by side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TeamFace team={match.home} align="start" />
          <MatchScoreCenter
            homeGoals={live?.homeGoals ?? null}
            awayGoals={live?.awayGoals ?? null}
            statusShort={live?.statusShort ?? "NS"}
            elapsed={live?.elapsed ?? null}
            elapsedDisplay={live?.elapsedDisplay ?? null}
            kickoffDt={dt}
            size="md"
          />
          <TeamFace team={match.away} align="end" />
        </div>

        <ScheduleBlock
          dt={dt}
          venueTz={venue.tz}
          venueCity={venue.city}
          theme={theme}
        />

        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <MatchCardBodyTabs
            key={`${match.matchNumber}-${defaultTab}`}
            lineups={lineups}
            keyEvents={keyEvents}
            commentary={commentary}
            stats={stats}
            loading={lineupsLoading}
            defaultTab={defaultTab}
            teamFlags={{
              home: { code: match.home.code, flagUrl: flagUrl(match.home.code) },
              away: { code: match.away.code, flagUrl: flagUrl(match.away.code) },
            }}
          />
        </div>

        <div className="mt-auto flex items-start gap-2 rounded-lg bg-zinc-950/40 px-2.5 py-2 ring-1 ring-inset ring-white/5">
          <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-emerald-100/95">
              {venue.name}
            </p>
            <p className="truncate text-[10px] text-zinc-500">
              {venue.city}
              <span className="text-zinc-600"> · </span>
              {venue.country}
            </p>
          </div>
        </div>
      </div>
    </MatchCardShell>
  )
}
