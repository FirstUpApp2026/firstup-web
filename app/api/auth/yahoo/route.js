import { NextResponse } from 'next/server'

export async function GET(request) {
  const clientId = process.env.YAHOO_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/yahoo`
  const userId = request.nextUrl.searchParams.get('user_id')

  const yahooAuthUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth')
  yahooAuthUrl.searchParams.set('client_id', clientId)
  yahooAuthUrl.searchParams.set('redirect_uri', redirectUri)
  yahooAuthUrl.searchParams.set('response_type', 'code')
  yahooAuthUrl.searchParams.set('scope', 'fspt-w')
  yahooAuthUrl.searchParams.set('state', userId)

  return NextResponse.redirect(yahooAuthUrl.toString())
}