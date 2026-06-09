/**
 * Visual chrome for match cards — gradient borders & accents by status / phase.
 *
 * @typedef {{
 *   frame: string
 *   card: string
 *   bar: string
 *   header: string
 *   hover?: string
 * }} MatchCardChrome
 */

/** @type {MatchCardChrome} */
const LIVE_CHROME = {
  frame:
    "bg-linear-to-b from-rose-500/55 via-rose-600/25 to-zinc-800/50 shadow-lg shadow-rose-950/35",
  card: "border-0 bg-linear-to-b from-zinc-800/45 to-zinc-950/98 shadow-inner shadow-black/20",
  bar: "from-rose-400/95 via-rose-500/60 to-transparent",
  header: "border-rose-500/20",
  hover: "hover:shadow-xl hover:shadow-rose-950/45",
}

/** @type {MatchCardChrome} */
const UPCOMING_CHROME = {
  frame:
    "bg-linear-to-b from-emerald-500/50 via-emerald-600/20 to-zinc-800/45 shadow-lg shadow-emerald-950/30",
  card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 shadow-inner shadow-black/20",
  bar: "from-emerald-400/90 via-emerald-500/45 to-transparent",
  header: "border-emerald-500/18",
  hover: "hover:shadow-xl hover:shadow-emerald-950/35",
}

/** Unified emerald chrome for All Football cards (live, results, upcoming). */
export const ALL_FOOTBALL_CARD_CHROME = {
  frame:
    "bg-linear-to-b from-emerald-500/50 via-emerald-600/22 to-emerald-950/60 shadow-lg shadow-emerald-950/30",
  card: "border-0 bg-linear-to-b from-emerald-950/40 via-zinc-900/92 to-zinc-950/98 shadow-inner shadow-black/25",
  bar: "from-emerald-400/90 via-emerald-500/45 to-transparent",
  header: "border-emerald-500/20",
  hover: "hover:shadow-xl hover:shadow-emerald-950/35",
}

/** @type {MatchCardChrome[]} */
const FT_ACCENTS = [
  {
    frame:
      "bg-linear-to-b from-sky-500/45 via-sky-600/18 to-zinc-800/45 shadow-lg shadow-sky-950/25",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-sky-400/90 via-sky-500/40 to-transparent",
    header: "border-sky-500/18",
    hover: "hover:shadow-xl hover:shadow-sky-950/30",
  },
  {
    frame:
      "bg-linear-to-b from-violet-500/45 via-violet-600/18 to-zinc-800/45 shadow-lg shadow-violet-950/25",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-violet-400/90 via-violet-500/40 to-transparent",
    header: "border-violet-500/18",
    hover: "hover:shadow-xl hover:shadow-violet-950/30",
  },
  {
    frame:
      "bg-linear-to-b from-amber-500/40 via-amber-600/16 to-zinc-800/45 shadow-lg shadow-amber-950/20",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-amber-400/90 via-amber-500/35 to-transparent",
    header: "border-amber-500/16",
    hover: "hover:shadow-xl hover:shadow-amber-950/25",
  },
  {
    frame:
      "bg-linear-to-b from-teal-500/45 via-teal-600/18 to-zinc-800/45 shadow-lg shadow-teal-950/25",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-teal-400/90 via-teal-500/40 to-transparent",
    header: "border-teal-500/18",
    hover: "hover:shadow-xl hover:shadow-teal-950/30",
  },
  {
    frame:
      "bg-linear-to-b from-indigo-500/45 via-indigo-600/18 to-zinc-800/45 shadow-lg shadow-indigo-950/25",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-indigo-400/90 via-indigo-500/40 to-transparent",
    header: "border-indigo-500/18",
    hover: "hover:shadow-xl hover:shadow-indigo-950/30",
  },
  {
    frame:
      "bg-linear-to-b from-fuchsia-500/40 via-fuchsia-600/16 to-zinc-800/45 shadow-lg shadow-fuchsia-950/22",
    card: "border-0 bg-linear-to-b from-zinc-800/38 to-zinc-950/98",
    bar: "from-fuchsia-400/85 via-fuchsia-500/35 to-transparent",
    header: "border-fuchsia-500/16",
    hover: "hover:shadow-xl hover:shadow-fuchsia-950/28",
  },
]

const LIVE_STATUSES = new Set(["LIVE", "1H", "2H", "HT", "ET", "P", "BT"])

/**
 * @param {string} statusShort
 * @param {number} [seed=0] fixture / match id for FT accent rotation
 * @returns {MatchCardChrome}
 */
export function getMatchCardChrome(statusShort, seed = 0) {
  if (LIVE_STATUSES.has(statusShort)) return LIVE_CHROME
  if (statusShort === "FT" || statusShort === "AET" || statusShort === "PEN") {
    const idx = Math.abs(Number(seed) || 0) % FT_ACCENTS.length
    return FT_ACCENTS[idx]
  }
  return UPCOMING_CHROME
}

/** @type {Record<string, MatchCardChrome>} */
export const PHASE_CARD_CHROME = {
  group: {
    frame:
      "bg-linear-to-b from-emerald-500/50 via-emerald-600/22 to-zinc-800/45 shadow-lg shadow-emerald-950/28",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-emerald-400/90 via-emerald-300/50 to-transparent",
    header: "border-emerald-500/18",
    hover: "hover:shadow-xl hover:shadow-emerald-950/35",
  },
  r32: {
    frame:
      "bg-linear-to-b from-lime-500/45 via-lime-600/18 to-zinc-800/45 shadow-lg shadow-lime-950/25",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-lime-400/90 via-lime-300/40 to-transparent",
    header: "border-lime-500/16",
    hover: "hover:shadow-xl hover:shadow-lime-950/30",
  },
  r16: {
    frame:
      "bg-linear-to-b from-sky-500/50 via-sky-600/20 to-zinc-800/45 shadow-lg shadow-sky-950/28",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-sky-400/90 via-sky-300/45 to-transparent",
    header: "border-sky-500/18",
    hover: "hover:shadow-xl hover:shadow-sky-950/32",
  },
  qf: {
    frame:
      "bg-linear-to-b from-rose-500/48 via-rose-600/20 to-zinc-800/45 shadow-lg shadow-rose-950/28",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-rose-400/90 via-rose-400/35 to-transparent",
    header: "border-rose-500/18",
    hover: "hover:shadow-xl hover:shadow-rose-950/32",
  },
  sf: {
    frame:
      "bg-linear-to-b from-teal-500/48 via-teal-600/20 to-zinc-800/45 shadow-lg shadow-teal-950/28",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-teal-400/90 via-teal-300/40 to-transparent",
    header: "border-teal-500/18",
    hover: "hover:shadow-xl hover:shadow-teal-950/32",
  },
  tp: {
    frame:
      "bg-linear-to-b from-amber-500/48 via-amber-600/20 to-zinc-800/45 shadow-lg shadow-amber-950/26",
    card: "border-0 bg-linear-to-b from-zinc-800/40 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-amber-400/90 via-amber-300/40 to-transparent",
    header: "border-amber-500/16",
    hover: "hover:shadow-xl hover:shadow-amber-950/30",
  },
  final: {
    frame:
      "bg-linear-to-b from-indigo-500/55 via-violet-600/25 to-zinc-800/50 shadow-lg shadow-indigo-950/35",
    card: "border-0 bg-linear-to-b from-zinc-800/45 to-zinc-950/98 backdrop-blur-sm",
    bar: "from-indigo-400/95 via-violet-400/45 to-transparent",
    header: "border-indigo-500/22",
    hover: "hover:shadow-xl hover:shadow-indigo-950/40",
  },
}
