'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const slotLabels = {
  0: 'QB',
  2: 'RB',
  4: 'WR',
  6: 'TE',
  23: 'FLEX',
  16: 'D/ST',
  17: 'K',
  20: 'BENCH',
  21: 'IR',
}

const starterOrder = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'D/ST', 'K']

const proTeamAbbrev = {
  1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN',
  8: 'DET', 9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR',
  15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ',
  21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC', 25: 'SF', 26: 'SEA',
  27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU',
}

const injuryAbbrev = {
  QUESTIONABLE: 'Q',
  DOUBTFUL: 'D',
  OUT: 'O',
  INJURY_RESERVE: 'IR',
}

export default function EspnTeamPage() {
  return (
    <Suspense fallback={<div style={pageStyle} />}>
      <EspnTeamPageInner />
    </Suspense>
  )
}

function EspnTeamPageInner() {
  const searchParams = useSearchParams()
  const leagueId = searchParams.get('league_id')
  const teamId = searchParams.get('team_id')

  const [userId, setUserId] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(function (result) {
      if (result.data.user) {
        setUserId(result.data.user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!userId || !leagueId || !teamId) {
      return
    }
    loadTeam()
  }, [userId, leagueId, teamId])

  async function loadTeam() {
    setLoading(true)
    setError('')

    const url = '/api/espn/league?user_id=' + userId + '&league_id=' + leagueId
    const res = await fetch(url)
    const json = await res.json()

    if (json.error) {
      setError(json.error)
      setLoading(false)
      return
    }

    const found = json.teams.find(function (t) {
      return String(t.id) === String(teamId)
    })

    setTeam(found || null)
    setLoading(false)
  }

  function teamName(t) {
    if (t.name) {
      return t.name
    }
    const combined = (t.location || '') + ' ' + (t.nickname || '')
    if (combined.trim()) {
      return combined.trim()
    }
    return 'Team ' + t.id
  }

  function rows(t) {
    const entries = (t.roster && t.roster.entries) || []
    return entries.map(function (entry) {
      const player = entry.playerPoolEntry ? entry.playerPoolEntry.player : null
      return {
        slot: slotLabels[entry.lineupSlotId] || 'OTHER',
        name: player ? player.fullName : 'Unknown',
        playerId: player ? player.id : null,
        proTeam: player ? proTeamAbbrev[player.proTeamId] || '' : '',
        position: player ? slotLabels[entry.lineupSlotId] || '' : '',
        injury: player && player.injuryStatus ? injuryAbbrev[player.injuryStatus] || '' : '',
      }
    })
  }

  function headshotUrl(playerId) {
    if (!playerId) {
      return null
    }
    return 'https://a.espncdn.com/i/headshots/nfl/players/full/' + playerId + '.png'
  }

  const allRows = team ? rows(team) : []
  const starters = allRows.filter(function (r) { return starterOrder.includes(r.slot) })
  const bench = allRows.filter(function (r) { return !starterOrder.includes(r.slot) })

  starters.sort(function (a, b) {
    return starterOrder.indexOf(a.slot) - starterOrder.indexOf(b.slot)
  })

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <a href={'/espn-league?league_id=' + leagueId} style={backLinkStyle}>Back to league</a>

        {loading && <p style={{ marginTop: 20 }}>Loading...</p>}
        {error && <p style={{ color: '#F4776A', marginTop: 20 }}>{error}</p>}

        {team && (
          <>
            <h1 style={{ marginTop: 10 }}>{teamName(team)}</h1>

            <div style={sectionHeaderStyle}>Starters</div>
            <RosterTable rows={starters} headshotUrl={headshotUrl} />

            <div style={{ ...sectionHeaderStyle, marginTop: 24 }}>Bench</div>
            <RosterTable rows={bench} headshotUrl={headshotUrl} />
          </>
        )}
      </div>
    </div>
  )
}

function RosterTable({ rows, headshotUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map(function (row, i) {
        const img = headshotUrl(row.playerId)
        return (
          <div key={i} style={rowStyle}>
            <div style={slotCellStyle}>{row.slot}</div>
            {img && (
              <img
                src={img}
                alt=""
                style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {row.name}
                {row.injury && <span style={injuryStyle}> {row.injury}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#8A94A3' }}>
                {row.proTeam} {row.position}
              </div>
            </div>
          </div>
        )
      })}
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
  maxWidth: 500,
  margin: '0 auto',
  padding: '40px 20px',
}

const backLinkStyle = {
  color: '#8A94A3',
  fontSize: 13,
  textDecoration: 'none',
}

const sectionHeaderStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#8A94A3',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: 16,
  marginBottom: 8,
  borderBottom: '1px solid #263140',
  paddingBottom: 6,
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  borderBottom: '1px solid #141B24',
}

const slotCellStyle = {
  width: 44,
  fontSize: 12,
  fontWeight: 700,
  color: '#8A94A3',
  flexShrink: 0,
}

const injuryStyle = {
  color: '#F4776A',
  fontSize: 12,
  fontWeight: 700,
}