/**
 * FIFA 3-letter codes used in this app → flagcdn.com path segment
 * (ISO 3166-1 alpha-2 or UK subdivision codes).
 * @see https://flagcdn.com
 */
const FIFA_TO_FLAGCDN = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CAN: "ca",
  COD: "cd",
  COL: "co",
  CPV: "cv",
  CRO: "hr",
  CIV: "ci",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  ESP: "es",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRQ: "iq",
  IRN: "ir",
  JOR: "jo",
  JPN: "jp",
  KOR: "kr",
  KSA: "sa",
  MAR: "ma",
  MEX: "mx",
  NED: "nl",
  NOR: "no",
  NZL: "nz",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  RSA: "za",
  SCO: "gb-sct",
  SEN: "sn",
  NIR: "gb-nir",
  WAL: "gb-wls",
  SUI: "ch",
  SWE: "se",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
}

export function flagUrl(code) {
  if (!code) return null
  const segment = FIFA_TO_FLAGCDN[code] ?? code
  return `https://flagcdn.com/h24/${segment.toLowerCase()}.png`
}
