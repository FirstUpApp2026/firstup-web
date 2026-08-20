'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function EspnLeaguePage() {
  const [leagueId, setLeagueId] = useState('45146606')
  const [userId, setUserId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then((result) => {
      if (result.data.user) {
        setUserId(result.data.user.id)
      }
    })
  }, [])

  async function loadLeague() {
    if (!userId || !leagueId) {
      return
    }
    setLoading(true)
    setError('')
    setData(null)

    const url = '/api/espn/league?user_id=' + userId + '&league_id=' + leagueId
    const res = await fetch(url)
    const json = await res.json()

    if (json.error) {
      let msg = json.error
      if (json.raw) {
        msg = msg + ' - ' + json.raw.slice(0, 150)
      }
      setError(msg)
    } else {
      setData(json)
    }
    setLoading(false)
  }

  function teamName(team) {
    if (team.name) {
      return team.name
    }
    const combined = (team.location || '') + ' ' + (team.nickname || '')
    if (combined.trim()) {
      return combined.trim()
    }
    return 'Team ' + team.id
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <a href="/" style={backLinkStyle}>Back home</a>
        <h1 style={{ marginTop: 10 }}>ESPN League</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={leagueId}
            onChange={function (e) { setLeagueId(e.target.value) }}
            placeholder="League ID"
            style={inputStyle}
          />
          <button onClick={loadLeague} style={loadButtonStyle}>
            Load
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: '#F4776A' }}>{error}</p>}

        {data && data.teams && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.teams.map(function (team) {
              const link = '/espn-league/team?league_id=' + leagueId + '&team_id=' + team.id
              return (
                <a key={team.id} href={link} style={teamLinkStyle}>
                  {teamName(team)}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const pageStyle = {
  background: '#0B0F14',
  minHeight: '100vh',
  color: '#EDEFF2',
  fontFamily: 'system-ui, sans-serif',
}

const containerStyle = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '40px 20px',
}

const backLinkStyle = {
  color: '#8A94A3',
  fontSize: 13,
  textDecoration: 'none',
}

const inputStyle = {
  flex: 1,
  padding: 8,
  background: '#141B24',
  border: '1px solid #263140',
  borderRadius: 6,
  color: '#EDEFF2',
}

const loadButtonStyle = {
  background: '#1B232D',
  border: '1px solid #F4B740',
  color: '#F4B740',
  borderRadius: 6,
  padding: '8px 14px',
  fontWeight: 600,
  cursor: 'pointer',
}

const teamLinkStyle = {
  display: 'block',
  background: '#141B24',
  border: '1px solid #1B232D',
  borderRadius: 8,
  padding: 14,
  color: '#EDEFF2',
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
}