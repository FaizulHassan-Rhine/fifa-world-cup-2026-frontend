import { useEffect, useState } from "react"
import { DateTime } from "luxon"

/**
 * @param {import("luxon").DateTime | null | undefined} kickoffDt
 */
function formatCountdown(kickoffDt) {
  if (!kickoffDt?.isValid) return { label: "", minutesLeft: null }

  const now = DateTime.now()
  const ms = kickoffDt.toMillis() - now.toMillis()

  if (ms <= 0) {
    return { label: "Starting soon", minutesLeft: 0 }
  }

  const totalMin = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60

  if (totalMin < 60) {
    return {
      label: totalMin === 1 ? "in 1 min" : `in ${totalMin} min`,
      minutesLeft: totalMin,
    }
  }

  if (hours < 48) {
    return {
      label: mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`,
      minutesLeft: totalMin,
    }
  }

  return {
    label: kickoffDt.toLocal().toFormat("ccc d MMM · HH:mm"),
    minutesLeft: totalMin,
  }
}

/**
 * Live countdown until kickoff. Re-ticks every second when < 1h away.
 *
 * @param {string | null | undefined} kickoffIso
 * @param {import("luxon").DateTime | null | undefined} [kickoffDt]
 */
export function useKickoffCountdown(kickoffIso, kickoffDt) {
  const [countdown, setCountdown] = useState(() => {
    const dt =
      kickoffDt ??
      (kickoffIso ? DateTime.fromISO(kickoffIso, { setZone: true }) : null)
    return formatCountdown(dt)
  })

  useEffect(() => {
    const dt =
      kickoffDt ??
      (kickoffIso ? DateTime.fromISO(kickoffIso, { setZone: true }) : null)
    if (!dt?.isValid) return undefined

    const tick = () => setCountdown(formatCountdown(dt))
    tick()

    let id = window.setInterval(tick, 60_000)
    const msUntil = dt.toMillis() - DateTime.now().toMillis()
    if (msUntil > 0 && msUntil < 3_600_000) {
      window.clearInterval(id)
      id = window.setInterval(tick, 1_000)
    }

    return () => window.clearInterval(id)
  }, [kickoffIso, kickoffDt])

  return countdown
}
