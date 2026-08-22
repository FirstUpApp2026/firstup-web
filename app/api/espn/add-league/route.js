import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request) {
  const body = await request.json()
  const userId = body.user_id
  const espnLeagueId = body.espn_league_id
  const leagueName = body.league_name

  if (!userId || !espnLeagueId || !leagueName) {
    return Response.json({ error: 'user_id, espn_league_id, and league_name are required' }, { status: 400 })
  }

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('espn_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connectionError || !connection) {
    return Response.json({ error: 'No ESPN connection found for this user' }, { status: 400 })
  }

  const espnUrl = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/' + espnLeagueId + '?view=mTeam&view=mSettings'

  const espnRes = await fetch(espnUrl, {
    headers: {
      Cookie: 'SWID=' + connection.swid + '; espn_s2=' + connection.espn_s2,
    },
  })

  if (!espnRes.ok) {
    return Response.json({ error: 'Failed to fetch league from ESPN' }, { status: 500 })
  }

  const espnData = await espnRes.json()

  const acquisitionType = espnData.settings?.acquisitionSettings?.acquisitionType
  const usesFaab = acquisitionType === 'WAIVER_BUDGET'

  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .insert({
      user_id: userId,
      yahoo_league_key: espnLeagueId,
      name: leagueName,
      sport: 'nfl',
      platform: 'espn',
      uses_faab: usesFaab,
    })
    .select()
    .single()

  if (leagueError) {
    return Response.json({ error: leagueError.message }, { status: 500 })
  }

  function normalizeSwid(swid) {
    return (swid || '').replace(/[{}]/g, '').toLowerCase()
  }

  const teamRows = espnData.teams.map(function (t) {
    const name = t.name || ((t.location || '') + ' ' + (t.nickname || '')).trim() || 'Team ' + t.id
    const isYourTeam = normalizeSwid(t.primaryOwner) === normalizeSwid(connection.swid)
    return {
      league_id: league.id,
      yahoo_team_key: String(t.id),
      team_name: name,
      user_id: isYourTeam ? userId : null,
    }
  }) 

  const { error: teamsError } = await supabaseAdmin
    .from('teams')
    .insert(teamRows)

  if (teamsError) {
    return Response.json({ error: teamsError.message }, { status: 500 })
  }

  return Response.json({
    message: 'League added successfully',
    league_id: league.id,
    teams_created: teamRows.length,
  })
}
