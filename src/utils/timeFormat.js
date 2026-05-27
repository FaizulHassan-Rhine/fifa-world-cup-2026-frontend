import { DateTime } from "luxon"

const ZONE_ET = "America/New_York"
const ZONE_BDT = "Asia/Dhaka"

export function parseKickoffEt(iso) {
  return DateTime.fromISO(iso, { zone: ZONE_ET })
}

export function formatLocal(dt, venueTz) {
  return dt.setZone(venueTz).toFormat("ccc dd LLL yyyy, HH:mm")
}

export function formatBdt(dt) {
  return dt.setZone(ZONE_BDT).toFormat("ccc dd LLL yyyy, HH:mm") + " BDT"
}

/** @param {import("luxon").DateTime} dt @param {string} zone */
export function formatMatchDate(dt, zone) {
  return dt.setZone(zone).toFormat("ccc, dd LLL yyyy")
}

/** @param {import("luxon").DateTime} dt @param {string} zone */
export function formatMatchTime(dt, zone) {
  return dt.setZone(zone).toFormat("HH:mm")
}

export function formatEt(dt) {
  return dt.setZone(ZONE_ET).toFormat("ccc dd LLL yyyy, HH:mm") + " ET"
}
