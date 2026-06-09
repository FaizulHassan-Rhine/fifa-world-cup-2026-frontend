import { useCallback, useMemo, useState } from "react"
import { GROUP_MATCHES } from "../data/groupMatches.js"
import { buildFullSchedule } from "../data/matches.js"
import { GroupStandings } from "../components/GroupStandings.jsx"
import { LiveWorldCupPanel } from "../components/LiveWorldCupPanel.jsx"
import { MatchCard } from "../components/MatchCard.jsx"
import { PredictionModal } from "../components/PredictionModal.jsx"
import { PredictorLeaderboard } from "../components/PredictorLeaderboard.jsx"
import { ScoreboardTabs } from "../components/ScoreboardTabs.jsx"
import { useEspnLineups } from "../hooks/useEspnLineups.js"
import { useEspnScoreboardStream } from "../hooks/useEspnScoreboardStream.js"
import { useLiveWorldCupMatchDetails } from "../hooks/useLiveWorldCupMatchDetails.js"
import { useWorldCupFixturePool } from "../hooks/useWorldCupFixturePool.js"
import { categorizeScheduleMatches } from "../utils/categorizeMatches.js"
import {
  findLiveForMatch,
  findLiveWorldCupFixtures,
} from "../utils/mergeLiveFixtures.js"

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

/** @typedef {"live" | "results" | "upcoming"} ScoreboardTab */

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

const liveProviderRaw = import.meta.env.VITE_LIVE_PROVIDER
const liveProvider =
  liveProviderRaw != null && String(liveProviderRaw).trim().toLowerCase() ===
  "football"
    ? "football"
    : "espn"

export default function WorldCupPage() {
  const schedule = useMemo(() => buildFullSchedule(), [])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [standingsRefresh, setStandingsRefresh] = useState(0)
  const [scoreboardTab, setScoreboardTab] = useState(
    /** @type {ScoreboardTab} */ ("live"),
  )
  const [footballActive, setFootballActive] = useState(false)

  const openPredictions = useCallback((match) => {
    if (match?.matchNumber) setSelectedMatch(match)
  }, [])

  const onPredictionUpdate = useCallback(() => {
    setStandingsRefresh((k) => k + 1)
  }, [])

  const espn = useEspnScoreboardStream({
    enabled: liveProvider === "espn",
    scope: "worldcup",
  })

  const football = useWorldCupFixturePool({
    leagueId: wcLeagueId,
    enabled: liveProvider === "football" && footballActive,
  })

  const index = liveProvider === "espn" ? espn.index : football.index
  const error = liveProvider === "espn" ? espn.error : football.error
  const loading = liveProvider === "espn" ? espn.loading : football.loading
  const lastUpdated =
    liveProvider === "espn" ? espn.lastUpdated : football.lastUpdated
  const pollSeconds =
    liveProvider === "espn" ? espn.pollSeconds : undefined

  const apiLiveOk =
    liveProvider === "espn"
      ? lastUpdated != null && !error
      : footballActive && lastUpdated != null && !error

  const categorized = useMemo(
    () => categorizeScheduleMatches(schedule, index),
    [schedule, index],
  )

  const tabCounts = useMemo(
    () => ({
      live: categorized.live.length,
      results: categorized.results.length,
      upcoming: categorized.upcoming.length,
    }),
    [categorized],
  )

  const tabRows = useMemo(() => {
    switch (scoreboardTab) {
      case "live":
        return categorized.live
      case "results":
        return categorized.results
      case "upcoming":
        return categorized.upcoming
      default:
        return []
    }
  }, [scoreboardTab, categorized])

  const tabFixtureIds = useMemo(
    () =>
      tabRows
        .map(({ match, live }) => {
          const row = live ?? findLiveForMatch(match, index)
          return row?.fixtureId
        })
        .filter((id) => id != null),
    [tabRows, index],
  )

  const liveWorldCupMatches = useMemo(() => {
    if (!apiLiveOk) return []
    if (liveProvider === "espn") return espn.liveMatches
    return findLiveWorldCupFixtures(football.entries)
  }, [apiLiveOk, liveProvider, espn.liveMatches, football.entries])

  const liveFixtureIds = useMemo(
    () =>
      liveWorldCupMatches
        .map((m) => m.fixtureId)
        .filter((id) => id != null),
    [liveWorldCupMatches],
  )

  const lineupEventIds = useMemo(
    () => [...new Set([...tabFixtureIds, ...liveFixtureIds])],
    [tabFixtureIds, liveFixtureIds],
  )

  const {
    lineups: espnLineups,
    keyEvents: espnKeyEvents,
    stats: espnStats,
    commentary: espnCommentary,
    loading: espnLineupsLoading,
  } = useEspnLineups({
    eventIds: lineupEventIds,
    scope: "worldcup",
    enabled: liveProvider === "espn" && apiLiveOk && lineupEventIds.length > 0,
  })

  const footballDetails = useLiveWorldCupMatchDetails(
    liveProvider === "football"
      ? [...new Set([...liveFixtureIds, ...tabFixtureIds])]
      : liveFixtureIds,
    apiLiveOk &&
      liveProvider === "football" &&
      (liveFixtureIds.length > 0 || tabFixtureIds.length > 0),
  )

  const liveMatchDetails =
    liveProvider === "espn" ? espn.matchDetails : footballDetails.details
  const liveDetailError =
    liveProvider === "espn" ? null : footballDetails.error
  const liveDetailLoading =
    liveProvider === "espn" ? false : footballDetails.loading

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

  const tabTitle = {
    live: "Live matches",
    results: "Results",
    upcoming: "Upcoming fixtures",
  }[scoreboardTab]

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">{tabTitle}</h2>
            {liveProvider === "espn" && apiLiveOk && (
              <p className="mt-0.5 text-[11px] text-zinc-500">
                ESPN live stream · scores update automatically
              </p>
            )}
            {liveProvider === "football" && !footballActive && (
              <button
                type="button"
                onClick={() => setFootballActive(true)}
                className="mt-2 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Load API-Football scores
              </button>
            )}
          </div>

          {liveProvider === "espn" && (
            <ScoreboardTabs
              active={scoreboardTab}
              onChange={setScoreboardTab}
              counts={tabCounts}
              lastUpdated={lastUpdated}
              pollSeconds={pollSeconds ?? 5}
              loading={loading}
            />
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        {scoreboardTab === "live" &&
          apiLiveOk &&
          liveWorldCupMatches.length > 0 && (
            <div className="space-y-4">
              {liveWorldCupMatches.map((m) => {
                const detail =
                  m.fixtureId != null
                    ? liveMatchDetails.get(m.fixtureId)
                    : undefined
                const events =
                  detail?.events ??
                  /** @type {{ events?: unknown[] }} */ (m).events ??
                  []
                const panelLineups =
                  liveProvider === "espn"
                    ? (espnLineups.get(m.fixtureId) ?? [])
                    : (detail?.lineups ?? [])
                const panelKeyEvents =
                  liveProvider === "espn"
                    ? (espnKeyEvents.get(m.fixtureId) ?? [])
                    : []
                return (
                  <LiveWorldCupPanel
                    key={m.fixtureId}
                    match={m}
                    events={events}
                    lineups={panelLineups}
                    keyEvents={panelKeyEvents}
                    detailLoading={
                      liveProvider === "espn"
                        ? espnLineupsLoading && panelLineups.length === 0
                        : liveDetailLoading
                    }
                    detailError={liveDetailError}
                    dataSource={liveProvider}
                  />
                )
              })}
            </div>
          )}

        {tabRows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {tabRows.map(({ match, live }) => {
              const liveData = live ?? findLiveForMatch(match, index)
              const fixtureId = liveData?.fixtureId
              const cardLineups =
                liveProvider === "espn"
                  ? (fixtureId ? espnLineups.get(fixtureId) ?? [] : [])
                  : fixtureId
                    ? (footballDetails.details.get(fixtureId)?.lineups ?? [])
                    : []
              const cardKeyEvents =
                fixtureId && liveProvider === "espn"
                  ? (espnKeyEvents.get(fixtureId) ?? [])
                  : []
              const cardStats =
                fixtureId && liveProvider === "espn"
                  ? (espnStats.get(fixtureId) ?? null)
                  : null
              const cardCommentary =
                fixtureId && liveProvider === "espn"
                  ? (espnCommentary.get(fixtureId) ?? [])
                  : []
              return (
                <MatchCard
                  key={match.matchNumber ?? `${match.group}-${match.kickoffEt}`}
                  match={match}
                  live={liveData}
                  lineups={cardLineups}
                  keyEvents={cardKeyEvents}
                  commentary={cardCommentary}
                  stats={cardStats}
                  lineupsLoading={
                    liveProvider === "espn"
                      ? espnLineupsLoading
                      : footballDetails.loading
                  }
                  onClick={() => openPredictions(match)}
                />
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400">
            {scoreboardTab === "live"
              ? "No World Cup match is live right now."
              : scoreboardTab === "results"
                ? "No finished matches yet."
                : "No upcoming fixtures in the schedule."}
          </p>
        )}

        <GroupStandings refreshKey={standingsRefresh} />

        <PredictorLeaderboard refreshKey={standingsRefresh} />

        <Section
          id="group-fixtures"
          title="Group stage fixtures"
          subtitle="Twelve groups (A–L), six matches each. Cards follow the official match order (#1, #2, #3 …); each card still shows its group."
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
