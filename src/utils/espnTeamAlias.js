import { apiTeamToCode } from "./teamAlias.js"

/** ESPN abbreviation → ISO3 codes used in the static schedule */
const ESPN_ABBREV_TO_CODE = {
  KORS: "KOR",
  RSA: "RSA",
  NED: "NED",
  HOL: "NED",
  KSA: "KSA",
  SAU: "KSA",
  CPV: "CPV",
  CUW: "CUW",
  CIV: "CIV",
  TUR: "TUR",
  ENG: "ENG",
  COD: "COD",
  CGO: "COD",
  USA: "USA",
  GER: "GER",
  SUI: "SUI",
  BIH: "BIH",
}

/**
 * @param {{ abbreviation?: string, displayName?: string, name?: string } | null | undefined} team
 * @returns {string | null}
 */
export function espnTeamToCode(team) {
  if (!team) return null
  const abbr = team.abbreviation?.trim().toUpperCase()
  if (abbr) {
    if (abbr.length === 3 && !ESPN_ABBREV_TO_CODE[abbr]) return abbr
    if (ESPN_ABBREV_TO_CODE[abbr]) return ESPN_ABBREV_TO_CODE[abbr]
    if (abbr.length === 3) return abbr
  }
  const name = team.displayName ?? team.name
  return apiTeamToCode({ name })
}
