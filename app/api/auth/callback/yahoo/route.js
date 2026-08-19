import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function GET(request) {
  const code = request.nextUrl.searchParams.get('code')
  const userId = request.nextUrl.searchParams.get('state')
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/yahoo`

  if (!code || !userId) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?yahoo_error=missing_code`)
  }

  const clientId = process.env.YAHOO_CLIENT_ID
  const clientSecret = process.env.YAHOO_CLIENT_SECRET
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    }),
  })

  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?yahoo_error=token_exchange_failed`)
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabaseAdmin.from('yahoo_connections').upsert({
    user_id: userId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: expiresAt,
    yahoo_guid: tokenData.xoauth_yahoo_guid || null,
  })

  return NextResponse.redirect(`${request.nextUrl.origin}/?yahoo_connected=true`)
}