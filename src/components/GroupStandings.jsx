import { useEffect, useState } from "react"
import { GROUPS } from "../data/groups.js"
import { fetchGroupStandings } from "../api/predictionsClient.js"
import { flagUrl } from "../utils/flags.js"

const GROUP_HEADER = {
  A: "bg-red-700",
  B: "bg-red-900",
  C: "bg-pink-700",
  D: "bg-blue-700",
  E: "bg-yellow-600",
  F: "bg-orange-600",
  G: "bg-teal-700",
  H: "bg-cyan-700",
  I: "bg-indigo-700",
  J: "bg-violet-700",
  K: "bg-fuchsia-700",
  L: "bg-slate-600",
}

function cell(value) {
  if (value == null || value === 0) return value === 0 ? 0 : "—"
  return value
}

export function GroupStandings({ refreshKey }) {
  const letters = Object.keys(GROUPS)
  const [apiGroups, setApiGroups] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchGroupStandings()
      .then((data) => {
        if (!cancelled) setApiGroups(data.groups || {})
      })
      .catch(() => {
        if (!cancelled) setApiGroups(null)
      })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const hasLiveData =
    apiGroups && Object.keys(apiGroups).some((g) => Object.keys(apiGroups[g]).length > 0)

  return (
    <section id="standings" className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-white">
        Groups {hasLiveData ? "(live)" : "(draw)"}
      </h2>
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        {hasLiveData
          ? "Played, goals, and points update when you set a final result on a group match."
          : "Standings fill in after you finalize group-stage scores from a match card."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {letters.map((g) => {
          const table = apiGroups?.[g] || {}
          const teams = GROUPS[g]
          const sorted = [...teams].sort((a, b) => {
            const ra = table[a.code]
            const rb = table[b.code]
            if (!ra && !rb) return 0
            if (!ra) return 1
            if (!rb) return -1
            return (
              rb.pts - ra.pts ||
              rb.gd - ra.gd ||
              rb.gf - ra.gf ||
              a.name.localeCompare(b.name)
            )
          })

          return (
            <div
              key={g}
              className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/50 shadow-md"
            >
              <div
                className={`px-3 py-2 text-center text-sm font-bold text-white ${GROUP_HEADER[g] || "bg-zinc-700"}`}
              >
                Group {g}
              </div>
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-700/80 text-[10px] uppercase text-zinc-500">
                    <th className="px-2 py-1.5 font-medium">Team</th>
                    <th className="w-8 px-1 py-1.5 text-center font-medium">
                      Pld
                    </th>
                    <th className="w-8 px-1 py-1.5 text-center font-medium">
                      GF
                    </th>
                    <th className="w-8 px-1 py-1.5 text-center font-medium">
                      GA
                    </th>
                    <th className="w-8 px-1 py-1.5 text-center font-medium">
                      GD
                    </th>
                    <th className="w-8 px-1 py-1.5 text-center font-medium">
                      Pts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => {
                    const row = table[t.code]
                    return (
                      <tr
                        key={t.code}
                        className="border-b border-zinc-800/80 last:border-0"
                      >
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            {flagUrl(t.code) ? (
                              <img
                                src={flagUrl(t.code)}
                                alt=""
                                width={28}
                                height={18}
                                className="h-4 w-7 rounded-sm object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="inline-block h-4 w-7 rounded-sm bg-zinc-700" />
                            )}
                            <span className="truncate font-medium text-zinc-200">
                              {t.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-center tabular-nums text-zinc-400">
                          {cell(row?.played)}
                        </td>
                        <td className="text-center tabular-nums text-zinc-400">
                          {cell(row?.gf)}
                        </td>
                        <td className="text-center tabular-nums text-zinc-400">
                          {cell(row?.ga)}
                        </td>
                        <td className="text-center tabular-nums text-zinc-400">
                          {row ? row.gd : "—"}
                        </td>
                        <td className="text-center font-semibold tabular-nums text-emerald-300/90">
                          {cell(row?.pts)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </section>
  )
}
