import { useState } from "react"

/** @typedef {"all" | "key"} CommentaryFilter */

/**
 * @param {{ kind: string }} props
 */
function CommentaryIcon({ kind }) {
  if (kind === "goal") {
    return <span className="text-lg leading-none" aria-hidden>⚽</span>
  }
  if (kind === "yellow") {
    return (
      <span
        className="inline-block h-4 w-2.5 rounded-none bg-yellow-400 ring-1 ring-black/25"
        aria-hidden
      />
    )
  }
  if (kind === "red") {
    return (
      <span
        className="inline-block h-4 w-2.5 rounded-none bg-red-500 ring-1 ring-black/25"
        aria-hidden
      />
    )
  }
  if (kind === "substitution") {
    return (
      <span className="text-xs font-bold leading-none text-zinc-300" aria-hidden>
        ↑↓
      </span>
    )
  }
  if (kind === "corner") {
    return <span className="text-base leading-none" aria-hidden>🚩</span>
  }
  if (kind === "blocked") {
    return <span className="text-base leading-none" aria-hidden>🛡️</span>
  }
  if (kind === "shot") {
    return <span className="text-base leading-none" aria-hidden>🥅</span>
  }
  if (kind === "foul" || kind === "penalty") {
    return (
      <svg
        className="h-4 w-4 text-zinc-300"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 4a4 4 0 0 0-4 4v8h2v-2h4v2h2V8a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v6h-4V8a2 2 0 0 1 2-2z" />
        <rect x="16" y="6" width="2" height="12" rx="1" />
        <circle cx="17" cy="4" r="2" />
      </svg>
    )
  }
  if (kind === "period") {
    return <span className="text-base leading-none" aria-hidden>⏱</span>
  }
  return <span className="text-xs text-zinc-500" aria-hidden>•</span>
}

/**
 * @param {{
 *   item: {
 *     minute: string
 *     text: string
 *     kind: string
 *     assistPlayer?: string | null
 *     playerIn?: string | null
 *     playerOut?: string | null
 *     subTeam?: string | null
 *   }
 * }} props
 */
function CommentaryRow({ item }) {
  const isSub = item.kind === "substitution"

  return (
    <div className="grid grid-cols-[2.5rem_2rem_1fr] items-start gap-2.5 border-b border-zinc-800/60 px-2 py-3 last:border-b-0">
      <span className="pt-0.5 text-right text-[13px] font-bold tabular-nums text-zinc-400">
        {item.minute || "—"}
      </span>
      <span className="flex h-5 items-center justify-center">
        <CommentaryIcon kind={item.kind} />
      </span>
      <div className="min-w-0">
        {isSub && (item.playerIn || item.playerOut) ? (
          <div className="space-y-1">
            {item.subTeam ? (
              <p className="text-[13px] font-semibold leading-snug text-zinc-200">
                Substitution — {item.subTeam}
              </p>
            ) : null}
            {item.playerIn ? (
              <p className="flex items-center gap-1.5 text-[13px] leading-snug text-emerald-300/95">
                <span className="font-bold" aria-hidden>↑</span>
                <span>{item.playerIn}</span>
              </p>
            ) : null}
            {item.playerOut ? (
              <p className="flex items-center gap-1.5 text-[13px] leading-snug text-rose-300/90">
                <span className="font-bold" aria-hidden>↓</span>
                <span>{item.playerOut}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-zinc-100">{item.text}</p>
        )}
        {item.assistPlayer ? (
          <p className="mt-1 flex items-center gap-1.5 text-[12px] leading-snug text-zinc-400">
            <span className="text-sm leading-none" aria-hidden>👟</span>
            <span>{item.assistPlayer}</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * @param {{
 *   commentary: {
 *     id: number
 *     minute: string
 *     text: string
 *     kind: string
 *     isKey: boolean
 *     assistPlayer?: string | null
 *     playerIn?: string | null
 *     playerOut?: string | null
 *     subTeam?: string | null
 *   }[]
 *   loading?: boolean
 *   className?: string
 * }} props
 */
export function MatchCommentary({ commentary, loading = false, className = "" }) {
  const [filter, setFilter] = useState(/** @type {CommentaryFilter} */ ("all"))
  const rows = Array.isArray(commentary) ? commentary : []
  const visible =
    filter === "key" ? rows.filter((row) => row.isKey) : rows

  const filters = [
    { id: /** @type {const} */ ("all"), label: "All Commentary" },
    { id: /** @type {const} */ ("key"), label: "Key Events" },
  ]

  return (
    <div className={className}>
      <div className="mb-2.5 flex justify-center">
        <div
          className="inline-flex rounded-full bg-zinc-200/10 p-0.5 shadow-sm ring-1 ring-white/10"
          role="tablist"
          aria-label="Commentary filter"
        >
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={(e) => {
                  e.stopPropagation()
                  setFilter(f.id)
                }}
                className={`relative rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f.label}
                {active ? (
                  <span
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-rose-500"
                    aria-hidden
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mb-2.5 text-center text-[13px] font-bold text-zinc-100">
        Match Commentary
      </p>

      {loading && !rows.length ? (
        <p className="py-6 text-center text-[13px] text-zinc-600">
          Loading commentary…
        </p>
      ) : visible.length > 0 ? (
        <div className="overflow-hidden">
          {visible.map((item, i) => (
            <CommentaryRow key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-[13px] text-zinc-600">
          {filter === "key"
            ? "No key events in commentary yet."
            : "Live commentary not available yet."}
        </p>
      )}
    </div>
  )
}
