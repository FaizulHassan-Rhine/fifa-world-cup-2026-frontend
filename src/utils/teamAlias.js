/** Lowercase API / FIFA name variants → ISO3 codes used in static schedule */
const NAME_TO_CODE = {
  mexico: "MEX",
  "south africa": "RSA",
  "south korea": "KOR",
  korea: "KOR",
  czechia: "CZE",
  "czech republic": "CZE",
  canada: "CAN",
  "bosnia and herzegovina": "BIH",
  "bosnia-herzegovina": "BIH",
  qatar: "QAT",
  switzerland: "SUI",
  brazil: "BRA",
  morocco: "MAR",
  scotland: "SCO",
  haiti: "HAI",
  "united states": "USA",
  usa: "USA",
  australia: "AUS",
  paraguay: "PAR",
  türkiye: "TUR",
  turkey: "TUR",
  germany: "GER",
  curaçao: "CUW",
  curacao: "CUW",
  "ivory coast": "CIV",
  "côte d'ivoire": "CIV",
  "cote d'ivoire": "CIV",
  ecuador: "ECU",
  netherlands: "NED",
  holland: "NED",
  japan: "JPN",
  tunisia: "TUN",
  sweden: "SWE",
  belgium: "BEL",
  iran: "IRN",
  egypt: "EGY",
  "new zealand": "NZL",
  spain: "ESP",
  "cabo verde": "CPV",
  "cape verde": "CPV",
  "saudi arabia": "KSA",
  uruguay: "URU",
  france: "FRA",
  senegal: "SEN",
  norway: "NOR",
  iraq: "IRQ",
  argentina: "ARG",
  austria: "AUT",
  algeria: "ALG",
  jordan: "JOR",
  portugal: "POR",
  colombia: "COL",
  uzbekistan: "UZB",
  "dr congo": "COD",
  "congo dr": "COD",
  "democratic republic of congo": "COD",
  england: "ENG",
  croatia: "CRO",
  panama: "PAN",
  ghana: "GHA",
}

/**
 * @param {{ name?: string, code?: string } | null | undefined} team
 * @returns {string | null} ISO3 or null if unknown
 */
export function apiTeamToCode(team) {
  if (!team) return null
  const code = team.code
  if (code && typeof code === "string") {
    const u = code.trim().toUpperCase()
    if (u.length === 3) return u
  }
  const name = team.name?.trim()
  if (!name) return null
  const key = name.toLowerCase()
  return NAME_TO_CODE[key] ?? null
}
