import { supabaseAdmin } from '../../../lib/supabaseAdmin'

async function mockSubmitClaim(entry) {
  // Placeholder for the real Yahoo/ESPN API call, once write access is approved.
  // For now, randomly succeed or fail so we can test the skip-to-next logic.
  const success = Math.random() > 0.3
  return { success: success }
}

export async function POST(request) {
  const body = await request.json()
  const leagueId = body.league_id

  if (!leagueId) {
    return Response.json({ error: 'league_id is required' }, { status: 400 })
  }

  const { data: teams, error: teamsError } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)

  if (teamsError) {
    return Response.json({ error: teamsError.message }, { status: 500 })
  }

  const teamIds = teams.map(function (t) { return t.id })

  const { data: queueEntries, error } = await supabaseAdmin
    .from('queue_entries')
    .select('*')
    .in('team_id', teamIds)
    .eq('status', 'pending')
    .order('rank', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const results = []

  for (const entry of queueEntries) {
    const claimResult = await mockSubmitClaim(entry)

    const newStatus = claimResult.success ? 'claimed' : 'failed'

    await supabaseAdmin
      .from('queue_entries')
      .update({ status: newStatus })
      .eq('id', entry.id)

    results.push({
      player_name: entry.player_name,
      rank: entry.rank,
      result: newStatus,
    })

    if (claimResult.success) {
      break
    }
  }

  return Response.json({
    message: 'waiver run completed for league ' + leagueId,
    results: results,
  })
}