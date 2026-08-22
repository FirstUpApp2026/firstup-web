import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const espnLeagueId = searchParams.get('espn_league_id')

  if (!userId || !espnLeagueId) {
    return Response.json({ error: 'user_id and espn_league_id are required' }, { status: 400 })
  }

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('espn_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connectionError || !connection) {
    return Response.json({ error: 'No ESPN connection found for this user' }, { status: 400 })
  }

  const espnUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/' + espnLeagueId + '?view=kona_player_info'

  const filter = {
    players: {
      filterStatus: { value: ['FREEAGENT', 'WAIVERS'] },
      limit: 50,
      sortPercOwned: { sortAsc: false, sortPriority: 1 },
    },
  }

  const espnRes = await fetch(espnUrl, {
    headers: {
      Cookie: 'SWID=' + connection.swid + '; espn_s2=' + connection.espn_s2,
      'X-Fantasy-Filter': JSON.stringify(filter),
    },
  })

  if (!espnRes.ok) {
    return Response.json({ error: 'Failed to fetch free agents from ESPN' }, { status: 500 })
  }

  const espnData = await espnRes.json()

  const positionMap = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'D/ST' }

  const teamMap = {
    1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
    9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
    17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
    25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU',
  }

  const players = (espnData.players || []).map(function (p) {
    const player = p.player
    const position = positionMap[player.defaultPositionId] || ''
    const team = teamMap[player.proTeamId] || ''
    const isDefense = position === 'D/ST'
    return {
      id: player.id,
      name: player.fullName,
      position: position,
      team: team,
      imageUrl: isDefense
        ? 'https://a.espncdn.com/i/teamlogos/nfl/500/' + team + '.png'
        : 'https://a.espncdn.com/i/headshots/nfl/players/full/' + player.id + '.png',
    }
  })

  return Response.json({ players: players })
}
