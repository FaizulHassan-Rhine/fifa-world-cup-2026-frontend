import { predictionsApiBase } from "./apiBases.js"

const BASE = predictionsApiBase()

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Request failed")
  }
  return data
}

export async function fetchMatchPredictions(matchNumber) {
  const res = await fetch(`${BASE}/matches/${matchNumber}`)
  return parseJson(res)
}

export async function submitPrediction(matchNumber, { name, homeGoals, awayGoals }) {
  const res = await fetch(`${BASE}/matches/${matchNumber}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, homeGoals, awayGoals }),
  })
  return parseJson(res)
}

export async function setMatchResult(
  matchNumber,
  { homeGoals, awayGoals, group, phase, home, away },
  adminKey,
) {
  const res = await fetch(`${BASE}/matches/${matchNumber}/result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
    },
    body: JSON.stringify({ homeGoals, awayGoals, group, phase, home, away }),
  })
  return parseJson(res)
}

export async function fetchGroupStandings() {
  const res = await fetch(`${BASE}/standings/groups`)
  return parseJson(res)
}

export async function fetchPredictorLeaderboard() {
  const res = await fetch(`${BASE}/standings/predictors`)
  return parseJson(res)
}
