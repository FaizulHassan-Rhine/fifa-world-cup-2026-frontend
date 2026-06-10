import { useMemo, useState } from "react"
import { GlobalMatchCard } from "../components/GlobalMatchCard.jsx"
import { ScoreboardTabs } from "../components/ScoreboardTabs.jsx"
import { useEspnLineups } from "../hooks/useEspnLineups.js"
import { useEspnScoreboardStream } from "../hooks/useEspnScoreboardStream.js"

/** @typedef {"live" | "results" | "upcoming"} ScoreboardTab */

export default function AllFootballPage() {
  const [scoreboardTab, setScoreboardTab] = useState(
    /** @type {ScoreboardTab} */ ("live"),
  )

  const espn = useEspnScoreboardStream({ enabled: true, scope: "all" })

  const apiOk = espn.lastUpdated != null && !espn.error

  const tabCounts = useMemo(
    () => ({
      live: espn.globalBuckets.live.length,
      results: espn.globalBuckets.results.length,
      upcoming: espn.globalBuckets.upcoming.length,
    }),
    [espn.globalBuckets],
  )

  const tabMatches = useMemo(() => {
    switch (scoreboardTab) {
      case "live":
        return espn.globalBuckets.live
      case "results":
        return espn.globalBuckets.results
      case "upcoming":
        return espn.globalBuckets.upcoming
      default:
        return []
    }
  }, [scoreboardTab, espn.globalBuckets])

  const tabFixtureIds = useMemo(
    () => tabMatches.map((m) => m.fixtureId).filter((id) => id != null),
    [tabMatches],
  )

  const liveFixtureIds = useMemo(
    () => espn.liveMatches.map((m) => m.fixtureId).filter((id) => id != null),
    [espn.liveMatches],
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
    loading: lineupsLoading,
  } = useEspnLineups({
    eventIds: lineupEventIds,
    scope: "all",
    enabled: apiOk && lineupEventIds.length > 0,
  })

  const tabTitle = {
    live: "Live football worldwide",
    results: "Results",
    upcoming: "Upcoming matches",
  }[scoreboardTab]

  return (
    <main
      id="main"
      className="mx-auto w-full min-w-0 max-w-7xl space-y-4 overflow-x-hidden px-4 pb-20 pt-8 sm:px-6 lg:px-8"
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white">{tabTitle}</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Global soccer from ESPN · all leagues · auto-refresh
          </p>
        </div>

        <ScoreboardTabs
          active={scoreboardTab}
          onChange={setScoreboardTab}
          counts={tabCounts}
          lastUpdated={espn.lastUpdated}
          pollSeconds={espn.pollSeconds}
          loading={espn.loading}
        />
      </div>

      {espn.error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {espn.error}
        </p>
      )}

      {tabMatches.length > 0 ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
          {tabMatches.map((match) => (
            <GlobalMatchCard
              key={match.fixtureId}
              className="min-w-0"
              match={match}
              lineups={espnLineups.get(match.fixtureId) ?? []}
              keyEvents={espnKeyEvents.get(match.fixtureId) ?? []}
              commentary={espnCommentary.get(match.fixtureId) ?? []}
              stats={espnStats.get(match.fixtureId) ?? null}
              lineupsLoading={lineupsLoading}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400">
          {espn.loading
            ? "Loading global matches…"
            : scoreboardTab === "live"
              ? "No football match is live right now."
              : scoreboardTab === "results"
                ? "No finished matches in the last 3 days."
                : "No upcoming matches found."}
        </p>
      )}
    </main>
  )
}
