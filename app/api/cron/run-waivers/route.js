import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

async function mockSubmitClaim(entry) {
  const success = Math.random() > 0.3
  return { success: success }
}

async function runWaiversForLeague(leagueId) {
  const { data: teams } = await supabaseAdmin
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)

  const teamIds = teams.map(function (t) { return t.id })

  const { data: queueEntries } = await supabaseAdmin
    .from('queue_entries')
    .select('*')
    .in('team_id', teamIds)
    .eq('status', 'pending')
    .order('rank', { ascending: true })

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

  return results
}

export async function GET(request) {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5)

  const { data: leagues, error } = await supabaseAdmin
    .from('leagues')
    .select('id, name, waiver_process_time')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const dueLeagues = leagues.filter(function (league) {
    if (!league.waiver_process_time) {
      return false
    }
    return league.waiver_process_time.slice(0, 5) === currentTime
  })

  const runSummaries = []

  for (const league of dueLeagues) {
    const results = await runWaiversForLeague(league.id)
    runSummaries.push({
      league_id: league.id,
      league_name: league.name,
      results: results,
    })
  }

  return Response.json({
    checked_at: currentTime,
    leagues_processed: runSummaries.length,
    summaries: runSummaries,
  })
}