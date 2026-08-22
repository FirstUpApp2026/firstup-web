import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

let cachedPlayers = null
let cachedAt = 0

async function getSleeperPlayers() {
  const now = Date.now()
  if (cachedPlayers && now - cachedAt < 1000 * 60 * 60 * 24) {
    return cachedPlayers
  }
  const res = await fetch('https://api.sleeper.app/v1/players/nfl')
  const data = await res.json()
  cachedPlayers = data
  cachedAt = now
  return data
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sleeperLeagueId = searchParams.get('sleeper_league_id')
  const query = (searchParams.get('q') || '').toLowerCase()

  if (!sleeperLeagueId) {
    return Response.json({ error: 'sleeper_league_id is required' }, { status: 400 })
  }

  const rostersRes = await fetch('https://api.sleeper.app/v1/league/' + sleeperLeagueId + '/rosters')
  const rosters = await rostersRes.json()

  const rosteredIds = new Set()
  rosters.forEach(function (r) {
    ;(r.players || []).forEach(function (pid) { rosteredIds.add(pid) })
  })

  const allPlayers = await getSleeperPlayers()

  const validPositions = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K']

  const matches = []
  for (const id in allPlayers) {
    if (rosteredIds.has(id)) continue
    const p = allPlayers[id]
    if (!p.full_name) continue
    const eligiblePositions = (p.fantasy_positions || []).filter(function (pos) {
      return validPositions.includes(pos)
    })
    if (eligiblePositions.length === 0) continue
    if (query && !p.full_name.toLowerCase().includes(query)) continue
    matches.push({
      id: id,
      name: p.full_name,
      position: eligiblePositions.join('/'),
    })
    if (matches.length >= 10) break
  }

  return Response.json({ players: matches })
}
