import { useMemo, useState } from "react"
import { DateTime } from "luxon"
import { useFixturesByDate } from "../hooks/useFixturesByDate.js"

function FixtureListItem({ row }) {
  if (!row || typeof row !== "object") return null
  const o = /** @type {Record<string, unknown>} */ (row)
  const fixture = /** @type {Record<string, unknown>} */ (o.fixture)
  const league = /** @type {Record<string, unknown>} */ (o.league)
  const teams = /** @type {Record<string, unknown>} */ (o.teams)
  const goals = /** @type {Record<string, unknown>} */ (o.goals)
  const home = /** @type {{ name?: string }} */ (teams?.home)
  const away = /** @type {{ name?: string }} */ (teams?.away)
  const status = /** @type {Record<string, unknown>} */ (fixture?.status)
  const hg = goals?.home
  const ag = goals?.away
  const score =
    typeof hg === "number" && typeof ag === "number" ? `${hg} — ${ag}` : "vs"
  const statusShort = /** @type {string | undefined} */ (status?.short)
  const elapsed = /** @type {number | null | undefined} */ (status?.elapsed)
  const when = /** @type {string | undefined} */ (fixture?.date)

  return (
    <li className="rounded-xl border border-white/8 bg-zinc-900/50 px-4 py-3 ring-1 ring-white/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {String(league?.name ?? "League")}
            {league?.country ? (
              <span className="text-zinc-600">
                {" "}
                · {String(league.country)}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">
            <span className="text-zinc-200">{home?.name ?? "Home"}</span>
            <span className="mx-2 text-zinc-600">{score}</span>
            <span className="text-zinc-200">{away?.name ?? "Away"}</span>
          </p>
          {when && (
            <p className="mt-1 font-mono text-[11px] text-zinc-500">{when}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {statusShort && (
            <span className="inline-block rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-300 ring-1 ring-white/10">
              {statusShort}
              {elapsed != null && statusShort === "LIVE" ? ` ${elapsed}'` : ""}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

function todayInputValue() {
  return DateTime.now().toFormat("yyyy-LL-dd")
}

export default function LiveFootballPage() {
  const [date, setDate] = useState(todayInputValue)
  const [leagueId, setLeagueId] = useState("")
  const [liveOnly, setLiveOnly] = useState(false)

  const hookDate = liveOnly ? todayInputValue() : date
  const { fixtures, error, loading, reload } = useFixturesByDate({
    date: hookDate,
    leagueId: leagueId.trim() || undefined,
    liveOnly,
  })

  const sorted = useMemo(() => {
    return [...fixtures].sort((a, b) => {
      const da = /** @type {{ fixture?: { timestamp?: number } }} */ (a).fixture
        ?.timestamp
      const db = /** @type {{ fixture?: { timestamp?: number } }} */ (b).fixture
        ?.timestamp
      return (da ?? 0) - (db ?? 0)
    })
  }, [fixtures])

  return (
    <main
      id="main"
      className="mx-auto max-w-3xl space-y-6 px-4 pb-20 pt-8 sm:px-6 lg:max-w-4xl lg:px-8"
    >
      <div>
        <h2 className="text-xl font-bold text-white">Live &amp; results</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Browse fixtures from API-Football (same dev proxy as the World Cup
          page). Production builds need a serverless proxy — the Vite dev server
          only forwards <code className="text-zinc-500">/api/football</code>{" "}
          locally.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-white/8 bg-zinc-900/40 p-4 ring-1 ring-white/5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-300">Match date</span>
          <input
            type="date"
            value={date}
            disabled={liveOnly}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-zinc-300">
            League id (optional)
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 39 for Premier League — from your API dashboard"
            value={leagueId}
            disabled={liveOnly}
            onChange={(e) => setLeagueId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={liveOnly}
            onChange={(e) => setLiveOnly(e.target.checked)}
            className="rounded border-zinc-600"
          />
          Live matches only (worldwide)
        </label>

        <button
          type="button"
          onClick={() => void reload()}
          className="w-fit rounded-lg bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {loading && !error && (
        <p className="text-sm text-zinc-500">Loading fixtures…</p>
      )}

      {!loading && !error && sorted.length === 0 && (
        <p className="text-sm text-zinc-500">
          No fixtures for this selection. Try another date or clear the league
          filter.
        </p>
      )}

      {!loading && sorted.length > 0 && (
        <ul className="space-y-2">
          {sorted.map((row) => {
            const id = /** @type {{ fixture?: { id?: number } }} */ (row)
              .fixture?.id
            return <FixtureListItem key={id ?? JSON.stringify(row)} row={row} />
          })}
        </ul>
      )}
    </main>
  )
}
