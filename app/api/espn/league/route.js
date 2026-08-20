import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get('user_id')
  const leagueId = request.nextUrl.searchParams.get('league_id')

  if (!userId || !leagueId) {
    return NextResponse.json({ error: 'Missing user_id or league_id' }, { status: 400 })
  }

  const { data: connection, error: connError } = await supabaseAdmin
    .from('espn_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (connError || !connection) {
    return NextResponse.json({ error: 'No ESPN connection found for this user' }, { status: 404 })
  }

  const espnUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`

  const espnResponse = await fetch(espnUrl, {
    headers: {
      Cookie: `SWID=${connection.swid}; espn_s2=${connection.espn_s2}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  })

  const rawText = await espnResponse.text()

  if (!espnResponse.ok) {
    return NextResponse.json(
      {
        error: 'ESPN request failed',
        status: espnResponse.status,
        raw: rawText.slice(0, 500),
      },
      { status: 200 }
    )
  }

  try {
    const data = JSON.parse(rawText)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: 'Could not parse ESPN response', raw: rawText.slice(0, 500) },
      { status: 200 }
    )
  }
}