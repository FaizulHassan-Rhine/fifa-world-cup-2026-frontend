/** Horizontal spread by ESPN formationPlace (1–11). */
const X_BY_PLACE = {
  1: 50,
  2: 88,
  3: 12,
  4: 70,
  5: 30,
  6: 42,
  7: 84,
  8: 66,
  9: 50,
  10: 50,
  11: 16,
}

/** @param {string | undefined | null} formation */
function parseFormation(formation) {
  return String(formation ?? "4-4-2")
    .trim()
    .split("-")
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/**
 * Map each formationPlace to a depth tier (0=GK, 1=DEF, 2+=outfield rows).
 *
 * @param {string | undefined | null} formation
 */
function buildTierMap(formation) {
  const parts = parseFormation(formation)
  const rows = parts.length ? parts : [4, 4, 2]

  /** @type {Record<number, number>} */
  const tier = { 1: 0 }

  /** @type {number[]} */
  let defPlaces
  if (rows[0] === 3) {
    defPlaces = [3, 4, 5]
  } else if (rows[0] === 5) {
    defPlaces = [2, 3, 4, 5, 6]
  } else {
    defPlaces = [2, 3, 4, 5]
  }

  for (const p of defPlaces) tier[p] = 1

  /** @type {number[]} */
  let outfield = [6, 8, 7, 11, 10, 9].filter((p) => !defPlaces.includes(p))
  if (rows[0] === 3) {
    outfield = [2, 11, ...outfield]
  }

  let idx = 0
  for (let r = 1; r < rows.length; r++) {
    const count = rows[r]
    for (let i = 0; i < count && idx < outfield.length; i++) {
      tier[outfield[idx]] = r + 1
      idx++
    }
  }

  for (const p of outfield.slice(idx)) {
    if (tier[p] == null) tier[p] = rows.length
  }

  return tier
}

/**
 * @param {number} tier
 * @param {number} maxTier
 */
function tierForwardness(tier, maxTier) {
  if (tier <= 0) return 0
  if (maxTier <= 1) return 0.5
  return tier / (maxTier + 0.35)
}

/**
 * @param {number | string | null | undefined} place
 * @param {"top" | "bottom"} half
 * @param {string | undefined | null} [formation]
 * @param {{ compact?: boolean }} [options]
 */
export function coordsForFormationPlace(place, half, formation, options = {}) {
  const { compact = false } = options
  const n = typeof place === "string" ? parseInt(place, 10) : place
  if (!Number.isFinite(n)) return { x: 50, y: half === "top" ? 25 : 75 }

  const tierMap = buildTierMap(formation)
  const tier = tierMap[n] ?? 2
  const maxTier = Math.max(...Object.values(tierMap), 1)
  const t = tierForwardness(tier, maxTier)
  const x = X_BY_PLACE[n] ?? 50
  const spread = compact ? 35 : 32
  const gkDepth = compact ? 9 : 10

  if (half === "top") {
    return { x, y: gkDepth + t * spread }
  }

  return { x, y: 100 - gkDepth - t * spread }
}

/**
 * Push apart players that sit too close on the pitch.
 *
 * @param {{ x: number, y: number }[]} positions
 * @param {{ minX?: number, maxX?: number, minY?: number, maxY?: number, minDist?: number }} [bounds]
 */
export function resolveFormationOverlaps(positions, bounds = {}) {
  const {
    minX = 8,
    maxX = 92,
    minY = 8,
    maxY = 92,
    minDist = 11,
  } = bounds

  const pts = positions.map((p) => ({ ...p }))

  for (let pass = 0; pass < 28; pass++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x
        const dy = pts[j].y - pts[i].y
        const dist = Math.hypot(dx, dy)
        if (dist >= minDist || dist === 0) continue

        const overlap = (minDist - dist) / 2
        const nx = dist === 0 ? 1 : dx / dist
        const ny = dist === 0 ? 0 : dy / dist

        pts[i].x -= nx * overlap
        pts[i].y -= ny * overlap * 0.55
        pts[j].x += nx * overlap
        pts[j].y += ny * overlap * 0.55
        moved = true
      }
    }

    for (const p of pts) {
      p.x = Math.max(minX, Math.min(maxX, p.x))
      p.y = Math.max(minY, Math.min(maxY, p.y))
    }

    if (!moved) break
  }

  return pts
}

/**
 * @param {{ formationPlace?: number | null }[]} xi
 * @param {"top" | "bottom"} half
 * @param {string | undefined | null} [formation]
 * @param {{ compact?: boolean }} [options]
 */
export function layoutFormationPlayers(xi, half, formation, options = {}) {
  const { compact = false } = options
  const raw = xi.map((entry) =>
    coordsForFormationPlace(entry.formationPlace, half, formation, { compact }),
  )

  const yMin = half === "top" ? (compact ? 6 : 8) : compact ? 56 : 54
  const yMax = half === "top" ? (compact ? 46 : 44) : compact ? 92 : 90

  return resolveFormationOverlaps(raw, {
    minX: compact ? 10 : 8,
    maxX: compact ? 90 : 92,
    minY: yMin,
    maxY: yMax,
    minDist: compact ? 17.5 : 14.5,
  })
}
