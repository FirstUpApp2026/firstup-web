import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
    const leagueId = searchParams.get('league_id')

  if (!userId) {
    return Response.json({ error: 'user_id is required' }, { status: 400 })
  }

    let leaguesQuery = supabaseAdmin
    .from('leagues')
    .select('id, name')
    .eq('user_id', userId)

  if (leagueId) {
    leaguesQuery = leaguesQuery.eq('id', leagueId)
  }

  const { data: leagues, error: leaguesError } = await leaguesQuery

  if (leaguesError) {
    return Response.json({ error: leaguesError.message }, { status: 500 })
  }

  const leagueIds = leagues.map(function (l) { return l.id })

  const { data: teams } = await supabaseAdmin
    .from('teams')
    .select('id, league_id')
    .in('league_id', leagueIds)

  const teamIds = teams.map(function (t) { return t.id })

  const { data: queueEntries } = await supabaseAdmin
    .from('queue_entries')
    .select('id, player_name, team_id')
    .in('team_id', teamIds)

  const { data: attempts, error: attemptsError } = await supabaseAdmin
    .from('transaction_attempts')
    .select('*')
    .in('queue_entry_id', queueEntries.map(function (q) { return q.id }))
    .order('attempted_at', { ascending: false })

  if (attemptsError) {
    return Response.json({ error: attemptsError.message }, { status: 500 })
  }

  const history = attempts.map(function (attempt) {
    const entry = queueEntries.find(function (q) { return q.id === attempt.queue_entry_id })
    const team = teams.find(function (t) { return entry && t.id === entry.team_id })
    const league = leagues.find(function (l) { return team && l.id === team.league_id })

    return {
      player_name: entry ? entry.player_name : 'Unknown',
      league_name: league ? league.name : 'Unknown',
      result: attempt.result,
      attempted_at: attempt.attempted_at,
      error_message: attempt.error_message,
    }
  })

  return Response.json({ history: history })
}