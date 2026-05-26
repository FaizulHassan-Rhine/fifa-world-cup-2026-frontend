import { STADIUMS } from "../data/stadiums.js"
import { flagUrl } from "../utils/flags.js"
import { formatBdt, formatLocal, parseKickoffEt } from "../utils/timeFormat.js"

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

function ClockIcon({ className }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function TeamRow({ team }) {
  const src = flagUrl(team.code)
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg bg-zinc-950/35 px-2.5 py-2.5 ring-1 ring-inset ring-white/6">
      {src ? (
        <img
          src={src}
          alt=""
          width={40}
          height={26}
          className="h-[26px] w-10 shrink-0 rounded object-cover shadow-md ring-1 ring-black/40"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      ) : (
        <span
          className="h-[26px] w-10 shrink-0 rounded bg-linear-to-br from-zinc-700 to-zinc-800 ring-1 ring-white/10"
          aria-hidden
        />
      )}
      <span className="truncate text-[13px] font-semibold leading-tight tracking-tight text-zinc-100">
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
  },
  r32: {
    bar: "from-lime-400/90 via-lime-300/40 to-transparent",
    glow: "shadow-lime-500/10 group-hover:shadow-lime-500/15",
    chip: "bg-lime-500/12 text-lime-100 ring-lime-400/20",
    vs: "border-lime-500/30 bg-lime-950/90 text-lime-100 ring-1 ring-lime-400/15",
  },
  r16: {
    bar: "from-sky-400/90 via-sky-300/45 to-transparent",
    glow: "shadow-sky-500/10 group-hover:shadow-sky-500/15",
    chip: "bg-sky-500/15 text-sky-100 ring-sky-400/25",
    vs: "border-sky-500/35 bg-sky-950/90 text-sky-100 ring-1 ring-sky-400/20",
  },
  qf: {
    bar: "from-rose-400/90 via-rose-400/35 to-transparent",
    glow: "shadow-rose-500/10 group-hover:shadow-rose-500/15",
    chip: "bg-rose-500/15 text-rose-100 ring-rose-400/25",
    vs: "border-rose-500/35 bg-rose-950/90 text-rose-100 ring-1 ring-rose-400/20",
  },
  sf: {
    bar: "from-teal-400/90 via-teal-300/40 to-transparent",
    glow: "shadow-teal-500/10 group-hover:shadow-teal-500/15",
    chip: "bg-teal-500/15 text-teal-100 ring-teal-400/25",
    vs: "border-teal-500/35 bg-teal-950/90 text-teal-100 ring-1 ring-teal-400/20",
  },
  tp: {
    bar: "from-amber-400/90 via-amber-300/40 to-transparent",
    glow: "shadow-amber-500/10 group-hover:shadow-amber-500/15",
    chip: "bg-amber-500/15 text-amber-100 ring-amber-400/25",
    vs: "border-amber-500/35 bg-amber-950/90 text-amber-100 ring-1 ring-amber-400/20",
  },
  final: {
    bar: "from-indigo-400/90 via-violet-400/40 to-transparent",
    glow: "shadow-indigo-500/10 group-hover:shadow-indigo-500/15",
    chip: "bg-indigo-500/15 text-indigo-100 ring-indigo-400/25",
    vs: "border-indigo-500/35 bg-indigo-950/90 text-indigo-100 ring-1 ring-indigo-400/20",
  },
}

function LiveScoreRow({ live }) {
  if (!live) return null
  const { homeGoals, awayGoals, statusShort, elapsed } = live
  const isLive = statusShort === "LIVE" || statusShort === "1H" || statusShort === "2H" || statusShort === "ET"
  const hasNums =
    typeof homeGoals === "number" && typeof awayGoals === "number"
  if (!hasNums && !statusShort) return null
  if (!hasNums && statusShort === "NS") return null

  const scoreText =
    hasNums ? `${homeGoals} — ${awayGoals}` : "—"
  const timeBit =
    isLive && elapsed != null ? `${elapsed}'` : statusShort || ""

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-900/80 px-3 py-2 ring-1 ring-inset ring-white/8">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-black tabular-nums tracking-tight text-white">
          {scoreText}
        </span>
        {timeBit && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {timeBit}
          </span>
        )}
      </div>
      {isLive && (
        <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 ring-1 ring-rose-400/30">
          Live
        </span>
      )}
      {!isLive && statusShort && statusShort !== "NS" && (
        <span className="rounded-md bg-zinc-700/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300 ring-1 ring-white/10">
          {statusShort}
        </span>
      )}
    </div>
  )
}

export function MatchCard({ match, live, onClick }) {
  const venue = STADIUMS[match.venueKey]
  const dt = parseKickoffEt(match.kickoffEt)
  const localStr = formatLocal(dt, venue.tz)
  const bdtStr = formatBdt(dt)
  const theme = phaseTheme[match.phase] || phaseTheme.group
  const interactive = typeof onClick === "function"

  return (
    <article
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
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-linear-to-b from-zinc-800/30 to-zinc-950/95 shadow-lg shadow-black/30 ring-1 ring-white/4 backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:border-white/12 hover:shadow-2xl ${theme.glow} ${interactive ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/80" : ""}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r ${theme.bar}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]"
        aria-hidden
      />

      <header className="relative flex items-start justify-between gap-2 border-b border-white/6 px-3.5 pb-2.5 pt-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide ring-1 ring-inset ${theme.chip}`}
          >
            #{match.matchNumber}
            {match.group ? (
              <span className="ml-1.5 font-semibold opacity-80">
                · Group {match.group}
              </span>
            ) : null}
          </span>
        </div>
        {match.label && match.phase !== "group" && (
          <p className="max-w-[55%] text-right text-[10px] font-medium leading-snug text-zinc-500">
            {match.label}
          </p>
        )}
      </header>

      <div className="relative space-y-3 px-3.5 pb-3.5 pt-3">
        <div className="flex gap-2.5 rounded-xl bg-zinc-950/40 px-3 py-2.5 ring-1 ring-inset ring-white/5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400/90 ring-1 ring-emerald-500/20">
            <PinIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-emerald-100/95">
              {venue.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              {venue.city}
              <span className="text-zinc-600"> · </span>
              {venue.country}
            </p>
          </div>
        </div>

        <LiveScoreRow live={live} />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 rounded-xl bg-zinc-950/50 px-2.5 py-2 ring-1 ring-inset ring-white/5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <ClockIcon className="h-3 w-3 shrink-0 opacity-70" />
              Local
            </div>
            <p className="text-[12px] font-medium leading-snug tracking-tight text-zinc-100 tabular-nums">
              {localStr}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-linear-to-br from-amber-950/50 to-zinc-950/60 px-2.5 py-2 ring-1 ring-inset ring-amber-500/15">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">
              <ClockIcon className="h-3 w-3 shrink-0 opacity-80" />
              BDT
            </div>
            <p className="text-[12px] font-semibold leading-snug tracking-tight text-amber-50/95 tabular-nums">
              {bdtStr}
            </p>
          </div>
        </div>

        <div className="relative space-y-2 pt-0.5">
          <TeamRow team={match.home} />
          <div className="flex justify-center py-0.5">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${theme.vs}`}
            >
              vs
            </span>
          </div>
          <TeamRow team={match.away} />
        </div>
      </div>
    </article>
  )
}
