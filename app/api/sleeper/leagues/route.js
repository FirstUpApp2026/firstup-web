import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return Response.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data: connection, error: connectionError } = await supabaseAdmin
    .from('sleeper_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connectionError || !connection) {
    return Response.json({ error: 'No Sleeper connection found for this user' }, { status: 400 })
  }

  const season = '2026'
  const sleeperUrl = 'https://api.sleeper.app/v1/user/' + connection.sleeper_user_id + '/leagues/nfl/' + season

  const sleeperRes = await fetch(sleeperUrl)

  if (!sleeperRes.ok) {
    return Response.json({ error: 'Failed to fetch leagues from Sleeper' }, { status: 500 })
  }

  const leagues = await sleeperRes.json()

  return Response.json({ leagues: leagues || [] })
}
