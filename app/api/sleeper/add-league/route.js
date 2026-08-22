import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request) {
  const body = await request.json()
  const userId = body.user_id
  const sleeperLeagueId = body.sleeper_league_id
  const leagueName = body.league_name

  if (!userId || !sleeperLeagueId || !leagueName) {
    return Response.json({ error: 'user_id, sleeper_league_id, and league_name are required' }, { status: 400 })
  }

  const rostersRes = await fetch('https://api.sleeper.app/v1/league/' + sleeperLeagueId + '/rosters')
  const usersRes = await fetch('https://api.sleeper.app/v1/league/' + sleeperLeagueId + '/users')

  if (!rostersRes.ok || !usersRes.ok) {
    return Response.json({ error: 'Failed to fetch league from Sleeper' }, { status: 500 })
  }

  const rosters = await rostersRes.json()
  const sleeperUsers = await usersRes.json()

  const { data: league, error: leagueError } = await supabaseAdmin
    .from('leagues')
    .insert({
      user_id: userId,
      yahoo_league_key: sleeperLeagueId,
      name: leagueName,
      sport: 'nfl',
      platform: 'sleeper',
    })
    .select()
    .single()

  if (leagueError) {
    return Response.json({ error: leagueError.message }, { status: 500 })
  }

  const teamRows = rosters.map(function (r) {
    const owner = sleeperUsers.find(function (u) { return u.user_id === r.owner_id })
    const name = (owner && (owner.metadata?.team_name || owner.display_name)) || 'Team ' + r.roster_id
    return {
      league_id: league.id,
      yahoo_team_key: String(r.roster_id),
      team_name: name,
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
