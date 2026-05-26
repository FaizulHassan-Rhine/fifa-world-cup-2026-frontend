import { useEffect, useState } from "react"
import { STADIUMS } from "../data/stadiums.js"
import {
  fetchMatchPredictions,
  setMatchResult,
  submitPrediction,
} from "../api/predictionsClient.js"
import { flagUrl } from "../utils/flags.js"

function FlagImg({ code, className = "h-8 w-12" }) {
  const src = flagUrl(code)
  if (!src) {
    return (
      <span
        className={`${className} shrink-0 rounded bg-zinc-700 ring-1 ring-white/10`}
        aria-hidden
      />
    )
  }
  return (
    <img
      src={src}
      alt=""
      className={`${className} shrink-0 rounded object-cover shadow ring-1 ring-black/40`}
    />
  )
}

function gradeStyles(grade) {
  if (grade === "exact") {
    return "border-emerald-500/50 bg-emerald-950/40 ring-emerald-400/25"
  }
  if (grade === "outcome") {
    return "border-emerald-600/35 bg-emerald-950/25 ring-emerald-500/15"
  }
  if (grade === "wrong") {
    return "border-rose-500/45 bg-rose-950/35 ring-rose-400/20"
  }
  return "border-white/8 bg-zinc-900/60 ring-white/5"
}

function PredictionRow({ p, finished, finalScore }) {
  const label =
    p.grade === "exact"
      ? "Exact"
      : p.grade === "outcome"
        ? "Result"
        : p.grade === "wrong"
          ? "Miss"
          : null

  return (
    <li
      className={`rounded-lg border px-3 py-2 ring-1 ring-inset transition ${gradeStyles(p.grade)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-zinc-100">
          {p.name}
        </span>
        {finished && label && (
          <span
            className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
              p.grade === "wrong" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {label}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-sm tabular-nums text-zinc-200">
        {p.homeGoals} — {p.awayGoals}
        {finished && finalScore && p.points > 0 && (
          <span className="ml-2 text-xs text-emerald-400/90">+{p.points}pt</span>
        )}
      </p>
    </li>
  )
}

export function PredictionModal({ match, onClose, onResultSet }) {
  const venue = STADIUMS[match.venueKey]
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem("wc-predictor-name") || ""
    } catch {
      return ""
    }
  })
  const [homeGoals, setHomeGoals] = useState("0")
  const [awayGoals, setAwayGoals] = useState("0")
  const [predictions, setPredictions] = useState([])
  const [finished, setFinished] = useState(false)
  const [finalScore, setFinalScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [adminKey, setAdminKey] = useState("")
  const [adminHome, setAdminHome] = useState("")
  const [adminAway, setAdminAway] = useState("")
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminSaving, setAdminSaving] = useState(false)

  const matchNumber = match?.matchNumber

  async function loadPredictions() {
    if (!matchNumber) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMatchPredictions(matchNumber)
      setPredictions(data.predictions || [])
      setFinished(data.finished)
      setFinalScore(data.finalScore)
      if (data.finalScore) {
        setAdminHome(String(data.finalScore.home))
        setAdminAway(String(data.finalScore.away))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!matchNumber) return undefined

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchMatchPredictions(matchNumber)
        if (cancelled) return
        setPredictions(data.predictions || [])
        setFinished(data.finished)
        setFinalScore(data.finalScore)
        if (data.finalScore) {
          setAdminHome(String(data.finalScore.home))
          setAdminAway(String(data.finalScore.away))
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [matchNumber])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const h = Number(homeGoals)
      const a = Number(awayGoals)
      await submitPrediction(match.matchNumber, {
        name: name.trim(),
        homeGoals: h,
        awayGoals: a,
      })
      try {
        localStorage.setItem("wc-predictor-name", name.trim())
      } catch {
        /* ignore */
      }
      await loadPredictions()
      onResultSet?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSetResult(e) {
    e.preventDefault()
    setAdminSaving(true)
    setError(null)
    try {
      await setMatchResult(
        match.matchNumber,
        {
          homeGoals: Number(adminHome),
          awayGoals: Number(adminAway),
          group: match.group ?? null,
          phase: match.phase ?? "group",
          home: match.home,
          away: match.away,
        },
        adminKey,
      )
      await loadPredictions()
      onResultSet?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setAdminSaving(false)
    }
  }

  if (!match) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl ring-1 ring-white/5">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90">
              Match #{match.matchNumber}
              {match.group ? ` · Group ${match.group}` : ""}
            </p>
            <h2
              id="prediction-modal-title"
              className="mt-1 text-lg font-bold text-white"
            >
              Predict the score
            </h2>
            {venue && (
              <p className="mt-0.5 text-xs text-zinc-500">
                {venue.name} · {venue.city}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-zinc-400 ring-1 ring-white/10 hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </header>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="overflow-y-auto border-b border-white/8 p-5 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <FlagImg code={match.home?.code} />
                <span className="max-w-[120px] truncate text-center text-sm font-semibold text-zinc-100">
                  {match.home?.name}
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400/80">
                vs
              </span>
              <div className="flex flex-col items-center gap-2">
                <FlagImg code={match.away?.code} />
                <span className="max-w-[120px] truncate text-center text-sm font-semibold text-zinc-100">
                  {match.away?.name}
                </span>
              </div>
            </div>

            {finished && finalScore && (
              <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Final result
                </p>
                <p className="font-mono text-xl font-black tabular-nums text-amber-50">
                  {finalScore.home} — {finalScore.away}
                </p>
              </div>
            )}

            {!finished ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="predictor-name"
                    className="mb-1 block text-xs font-medium text-zinc-400"
                  >
                    Your name
                  </label>
                  <input
                    id="predictor-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahim"
                    className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-emerald-500/30 focus:border-emerald-500/50 focus:ring-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="pred-home"
                      className="mb-1 block text-xs font-medium text-zinc-400"
                    >
                      {match.home?.name || "Home"}
                    </label>
                    <input
                      id="pred-home"
                      type="number"
                      min={0}
                      max={20}
                      required
                      value={homeGoals}
                      onChange={(e) => setHomeGoals(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-mono text-lg font-bold tabular-nums text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="pred-away"
                      className="mb-1 block text-xs font-medium text-zinc-400"
                    >
                      {match.away?.name || "Away"}
                    </label>
                    <input
                      id="pred-away"
                      type="number"
                      min={0}
                      max={20}
                      required
                      value={awayGoals}
                      onChange={(e) => setAwayGoals(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-mono text-lg font-bold tabular-nums text-white outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Submit prediction"}
                </button>
                <p className="text-[11px] text-zinc-500">
                  Same name updates your pick. Exact score = 3 pts, correct
                  result = 1 pt.
                </p>
              </form>
            ) : (
              <p className="text-center text-sm text-zinc-500">
                Predictions are closed for this match.
              </p>
            )}

            <div className="mt-6 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={() => setAdminOpen((v) => !v)}
                className="text-[11px] font-medium text-zinc-600 hover:text-zinc-400"
              >
                {adminOpen ? "Hide" : "Admin: set final result"}
              </button>
              {adminOpen && (
                <form onSubmit={handleSetResult} className="mt-3 space-y-3">
                  <input
                    type="password"
                    placeholder="Admin key"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      required
                      placeholder="Home goals"
                      value={adminHome}
                      onChange={(e) => setAdminHome(e.target.value)}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-mono text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      max={20}
                      required
                      placeholder="Away goals"
                      value={adminAway}
                      onChange={(e) => setAdminAway(e.target.value)}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-center font-mono text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={adminSaving}
                    className="w-full rounded-lg bg-amber-700/90 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    {adminSaving ? "Saving…" : "Lock final result"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col bg-zinc-950/50">
            <div className="shrink-0 border-b border-white/8 px-5 py-3">
              <h3 className="text-sm font-bold text-zinc-200">
                Everyone&apos;s predictions
              </h3>
              <p className="text-[11px] text-zinc-500">
                {finished
                  ? "Green = exact or correct result · Red = wrong"
                  : "Updates when someone submits"}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading…</p>
              ) : predictions.length === 0 ? (
                <p className="text-sm text-zinc-500">No predictions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {predictions.map((p) => (
                    <PredictionRow
                      key={p.id}
                      p={p}
                      finished={finished}
                      finalScore={finalScore}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="shrink-0 border-t border-rose-500/20 bg-rose-950/40 px-5 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
