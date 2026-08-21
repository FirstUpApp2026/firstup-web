'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  pageStyle,
  containerStyle,
  sectionHeaderStyle,
  cardStyle,
  formatSport,
  formatPlatform,
  buttonSecondaryStyle,
  buttonPrimaryStyle,
  colors,
} from '../lib/theme'
import Logo from '../components/Logo'
import Header from '../components/Header'
import SportIcon from '../components/SportIcon'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }
      setUser(userData.user)

      const { data: leagueData } = await supabase
        .from('leagues')
        .select('*')
        .eq('user_id', userData.user.id)

      const leagueIds = (leagueData || []).map(function (l) { return l.id })

      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .in('league_id', leagueIds)

      const merged = (leagueData || []).map(function (league) {
        const team = (teamData || []).find(function (t) { return t.league_id === league.id })
        return { ...league, team_name: team ? team.team_name : null }
      })

      setLeagues(merged)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ padding: 40 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {user ? (
          <>
            <Header user={user} />
            {Object.entries(
              leagues.reduce(function (groups, league) {
                const sportKey = formatSport(league.sport) || 'Other'
                if (!groups[sportKey]) groups[sportKey] = {}
                const platformKey = formatPlatform(league.platform) || 'Other'
                if (!groups[sportKey][platformKey]) groups[sportKey][platformKey] = []
                groups[sportKey][platformKey].push(league)
                return groups
              }, {})
            ).map(function (sportEntry) {
              const sportKey = sportEntry[0]
              const platformGroups = sportEntry[1]
              return (
                <div key={sportKey} style={{ marginBottom: 20 }}>
                  <h2 style={{ ...sectionHeaderStyle, display: 'flex', alignItems: 'center', gap: 10 }}><SportIcon sport={sportKey} />{sportKey}</h2>
                  {Object.entries(platformGroups).map(function (platformEntry) {
                    const platformKey = platformEntry[0]
                    const platformLeagues = platformEntry[1]
                    return (
                      <div key={platformKey} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, marginBottom: 6 }}>
                          {platformKey}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {platformLeagues.map(function (league) {
                            return (
                              <a
                                key={league.id}
                                href={'/leagues/' + league.id}
                                style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', display: 'block' }}
                              >
                                {league.team_name && (
                                  <div style={{ fontWeight: 600, fontSize: 16 }}>{league.team_name}</div>
                                )}
                                <div style={{ color: colors.textMuted, fontSize: 13, marginTop: league.team_name ? 2 : 0, fontWeight: league.team_name ? 400 : 600, fontSize: league.team_name ? 13 : 16 }}>
                                  {league.name}
                                </div>
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            {leagues.length === 0 && (
              <div
                style={{
                  border: '1px dashed ' + colors.border,
                  borderRadius: 10,
                  padding: 24,
                  textAlign: 'center',
                  color: colors.textFaint,
                  marginBottom: 20,
                }}
              >
                No leagues yet.
              </div>
            )}

            <h2 style={sectionHeaderStyle}>Connect a Platform</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={'/api/auth/yahoo?user_id=' + user.id} style={{ textDecoration: 'none' }}>
                <button style={{ ...buttonSecondaryStyle, width: '100%' }}>
                  Connect yahoo! Account
                </button>
              </a>
              <a href="/connect-espn" style={{ textDecoration: 'none' }}>
                <button style={{ ...buttonSecondaryStyle, width: '100%' }}>
                  Connect ESPN Account
                </button>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.8" style={{ flexShrink: 0, marginLeft: 10 }}>
                  <path d="M6 4v9a4 4 0 0 0 4 4h8M14 13l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a href="/add-espn-league" style={{ textDecoration: 'none', flex: 1 }}>
                  <button style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, color: colors.textMuted, background: 'transparent', border: '1px dashed ' + colors.border, borderRadius: 6, cursor: 'pointer' }}>
                    Add ESPN League
                  </button>
                </a>
              </div>
              <button style={{ ...buttonSecondaryStyle, width: '100%', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                Connect sleeper Account (Coming Soon)
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Logo />
            </div>
            <p style={{ color: colors.textMuted, marginTop: -20, marginBottom: 24 }}>
              Sleep in. We'll grab the free agent.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 260, margin: '0 auto' }}>
              <a href="/login" style={{ textDecoration: 'none' }}>
                <button style={{ ...buttonPrimaryStyle, width: '100%' }}>
                  Log In
                </button>
              </a>
              <a href="/signup" style={{ textDecoration: 'none' }}>
                <button style={{ ...buttonSecondaryStyle, width: '100%' }}>
                  Sign Up
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
