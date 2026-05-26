import { useEffect, useState } from "react"
import { fetchPredictorLeaderboard } from "../api/predictionsClient.js"

export function PredictorLeaderboard({ refreshKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPredictorLeaderboard()
      .then((data) => {
        if (!cancelled) {
          setRows(data.leaderboard || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (!loading && rows.length === 0) return null

  return (
    <section id="predictor-points" className="scroll-mt-24 border-t border-zinc-800/80 pt-12">
      <h2 className="mb-1 text-xl font-bold tracking-tight text-white">
        Prediction points
      </h2>
      <p className="mb-4 max-w-3xl text-sm text-zinc-400">
        3 points for an exact score, 1 point for the correct result (win / draw).
        Updates after matches are finalized.
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-700/80 bg-zinc-900/50">
          <table className="w-full min-w-[320px] text-left text-sm text-zinc-300">
            <thead>
              <tr className="border-b border-zinc-700/80 text-[10px] uppercase text-zinc-500">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 text-center font-medium">Pts</th>
                <th className="px-3 py-2 text-center font-medium">Exact</th>
                <th className="px-3 py-2 text-center font-medium">Result</th>
                <th className="px-3 py-2 text-center font-medium">Played</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.name}
                  className="border-b border-zinc-800/80 last:border-0"
                >
                  <td className="px-3 py-2 text-zinc-500">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-zinc-100">
                    {r.name}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-300">
                    {r.points}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {r.exact}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {r.outcome}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums text-zinc-500">
                    {r.played}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
