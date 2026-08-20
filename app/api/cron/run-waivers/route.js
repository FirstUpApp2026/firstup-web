import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

async function mockSubmitClaim(entry) {
  const success = Math.random() > 0.3
  return { success: success }
}

async function runWaiversForLeague(leagueId) {
  const { data: waiverRun } = await supabaseAdmin
    .from('waiver_runs')
    .insert({
      league_id: leagueId,
      scheduled_time: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      status: 'running',
    })
    .select()
    .single()

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

    const transactionResult = claimResult.success ? 'success' : 'fail'

    const { error: insertError } = await supabaseAdmin
      .from('transaction_attempts')
      .insert({
        queue_entry_id: entry.id,
        waiver_run_id: waiverRun.id,
        attempted_at: new Date().toISOString(),
        result: transactionResult,
        yahoo_response: null,
        error_message: claimResult.success ? null : 'mock claim failed',
      })

    if (insertError) {
      console.error('transaction_attempts insert failed:', insertError.message)
    }

    const team = teams.find(function (t) { return t.id === entry.team_id })
    const notificationMessage = claimResult.success
      ? 'Your claim for ' + entry.player_name + ' was successful!'
      : 'Your claim for ' + entry.player_name + ' failed.'

    if (team) {
      const { data: leagueRow } = await supabaseAdmin
        .from('leagues')
        .select('user_id')
        .eq('id', leagueId)
        .single()

      if (leagueRow) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: leagueRow.user_id,
            message: notificationMessage,
          })
      }
    }

    results.push({
      player_name: entry.player_name,
      rank: entry.rank,
      result: newStatus,
    })

    if (claimResult.success) {
      break
    }
  }

  await supabaseAdmin
    .from('waiver_runs')
    .update({ status: 'completed' })
    .eq('id', waiverRun.id)

  return results
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

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