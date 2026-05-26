import { useCallback, useMemo, useState } from "react"
import { GROUP_MATCHES } from "../data/groupMatches.js"
import { buildFullSchedule } from "../data/matches.js"
import { GroupStandings } from "../components/GroupStandings.jsx"
import { MatchCard } from "../components/MatchCard.jsx"
import { PredictionModal } from "../components/PredictionModal.jsx"
import { PredictorLeaderboard } from "../components/PredictorLeaderboard.jsx"
import { useWorldCupFixturePool } from "../hooks/useWorldCupFixturePool.js"
import { findLiveForMatch } from "../utils/mergeLiveFixtures.js"

const SECTION_NAV = [
  { href: "#standings", label: "Groups" },
  { href: "#predictor-points", label: "Points" },
  { href: "#group-fixtures", label: "Group fixtures" },
  { href: "#r32", label: "Round of 32" },
  { href: "#r16", label: "Round of 16" },
  { href: "#qf", label: "Quarter-finals" },
  { href: "#sf", label: "Semi-finals" },
  { href: "#finals", label: "Final / 3rd" },
]

function Section({ id, title, subtitle, children, className = "" }) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-zinc-800/80 pt-12 ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  )
}

const wcLeagueRaw = import.meta.env.VITE_WORLD_CUP_LEAGUE_ID
const wcLeagueId =
  wcLeagueRaw != null && String(wcLeagueRaw).trim() !== ""
    ? String(wcLeagueRaw).trim()
    : undefined

export default function WorldCupPage() {
  const schedule = useMemo(() => buildFullSchedule(), [])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [standingsRefresh, setStandingsRefresh] = useState(0)
  const [liveActive, setLiveActive] = useState(false)

  const openPredictions = useCallback((match) => {
    if (match?.matchNumber) setSelectedMatch(match)
  }, [])

  const onPredictionUpdate = useCallback(() => {
    setStandingsRefresh((k) => k + 1)
  }, [])
  const { index, error, loading, lastUpdated, reload } = useWorldCupFixturePool({
    leagueId: wcLeagueId,
    enabled: liveActive,
  })

  const apiLiveOk = liveActive && lastUpdated != null && !error

  const byPhase = useMemo(() => {
    const group = schedule.filter((m) => m.phase === "group")
    const r32 = schedule.filter((m) => m.phase === "r32")
    const r16 = schedule.filter((m) => m.phase === "r16")
    const qf = schedule.filter((m) => m.phase === "qf")
    const sf = schedule.filter((m) => m.phase === "sf")
    const finals = schedule.filter((m) => m.phase === "tp" || m.phase === "final")
    return { group, r32, r16, qf, sf, finals }
  }, [schedule])

  const groupMatchesByNumber = useMemo(() => {
    const key = (m) =>
      `${m.group}|${m.kickoffEt}|${m.home.code}|${m.away.code}`
    const numberMap = new Map(
      schedule
        .filter((m) => m.phase === "group")
        .map((m) => [key(m), m.matchNumber]),
    )
    return [...GROUP_MATCHES]
      .map((m) => ({
        ...m,
        matchNumber: numberMap.get(key(m)),
      }))
      .sort((a, b) => (a.matchNumber ?? 0) - (b.matchNumber ?? 0))
  }, [schedule])

  return (
    <>
      <div className="mx-auto max-w-7xl border-b border-zinc-800/40 px-4 py-3 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
          {SECTION_NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-md px-1.5 py-0.5 text-emerald-400/90 hover:bg-zinc-800 hover:text-emerald-300"
            >
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      <main
        id="main"
        className="mx-auto max-w-7xl space-y-4 px-4 pb-20 pt-8 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-medium text-zinc-200">
              Live &amp; results
            </span>
            {apiLiveOk ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30"
                title={`API data in use · last fetch ${lastUpdated.toLocaleTimeString()}`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                  aria-hidden
                />
                Active
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (!liveActive) setLiveActive(true)
                  else void reload()
                }}
                className="rounded-lg bg-emerald-600/90 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Fetching…"
                  : liveActive
                    ? "Refresh scores from API"
                    : "Load live scores from API"}
              </button>
            </div>
            {!liveActive ? (
              <p className="max-w-xl text-[11px] text-zinc-500 sm:text-right">
                No API calls until you click — saves your daily quota.
              </p>
            ) : null}
          </div>
        </div>

        <GroupStandings refreshKey={standingsRefresh} />

        <PredictorLeaderboard refreshKey={standingsRefresh} />

        <Section
          id="group-fixtures"
          title="Group stage fixtures"
          subtitle="Twelve groups (A–L), six matches each. Cards follow the official match order (#1, #2, #3 …); each card still shows its group."
        >
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groupMatchesByNumber.map((m) => (
              <MatchCard
                key={m.matchNumber ?? `${m.group}-${m.kickoffEt}`}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="r32"
          title="Round of 32"
          subtitle="Sixteen ties — placeholders show bracket positions until teams are known. Live scores appear when both teams are known and the API reports the fixture."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byPhase.r32.map((m) => (
              <MatchCard
                key={m.matchNumber}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="r16"
          title="Round of 16"
          subtitle="Eight matches — winners advance to the quarter-finals."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byPhase.r16.map((m) => (
              <MatchCard
                key={m.matchNumber}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="qf"
          title="Quarter-finals"
          subtitle="Four matches at Boston, Los Angeles, Miami, and Kansas City."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {byPhase.qf.map((m) => (
              <MatchCard
                key={m.matchNumber}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="sf"
          title="Semi-finals"
          subtitle="Dallas and Atlanta host the semi-finals."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {byPhase.sf.map((m) => (
              <MatchCard
                key={m.matchNumber}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="finals"
          title="Third place & final"
          subtitle="Miami (third place) and New York/New Jersey (final)."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {byPhase.finals.map((m) => (
              <MatchCard
                key={m.matchNumber}
                match={m}
                live={findLiveForMatch(m, index)}
                onClick={() => openPredictions(m)}
              />
            ))}
          </div>
        </Section>

        <footer className="border-t border-zinc-800/80 pt-8 text-center text-[11px] text-zinc-600">
          Fan schedule page — times from public ET listings; always confirm with
          FIFA before travel. FIFA World Cup™ is a trademark of FIFA.
        </footer>
      </main>

      {selectedMatch && (
        <PredictionModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onResultSet={onPredictionUpdate}
        />
      )}
    </>
  )
}
