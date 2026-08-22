import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request) {
  const body = await request.json()
  const userId = body.user_id
  const sleeperUsername = body.sleeper_username

  if (!userId || !sleeperUsername) {
    return Response.json({ error: 'user_id and sleeper_username are required' }, { status: 400 })
  }

  const sleeperRes = await fetch('https://api.sleeper.app/v1/user/' + sleeperUsername)

  if (!sleeperRes.ok) {
    return Response.json({ error: 'Sleeper username not found' }, { status: 400 })
  }

  const sleeperUser = await sleeperRes.json()

  if (!sleeperUser || !sleeperUser.user_id) {
    return Response.json({ error: 'Sleeper username not found' }, { status: 400 })
  }

  const { error: upsertError } = await supabaseAdmin
    .from('sleeper_connections')
    .upsert(
      {
        user_id: userId,
        sleeper_username: sleeperUsername,
        sleeper_user_id: sleeperUser.user_id,
      },
      { onConflict: 'user_id' }
    )

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 })
  }

  return Response.json({
    message: 'Sleeper account connected',
    sleeper_user_id: sleeperUser.user_id,
  })
}
