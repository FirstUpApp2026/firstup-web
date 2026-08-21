'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { pageStyle, containerStyle, inputStyle, buttonPrimaryStyle, colors } from '../../lib/theme'
import Header from '../../components/Header'

export default function AddEspnLeaguePage() {
  const [user, setUser] = useState(null)
  const [leagueId, setLeagueId] = useState('')
  const [leagueName, setLeagueName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(function () {
    supabase.auth.getUser().then(function (result) {
      setUser(result.data.user)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user || !leagueId.trim() || !leagueName.trim()) {
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/espn/add-league', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        espn_league_id: leagueId.trim(),
        league_name: leagueName.trim(),
      }),
    })
    const json = await res.json()

    if (json.error) {
      setError(json.error)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, maxWidth: 400 }}>
        <Header user={user} />
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Add an ESPN League</h1>
        <p style={{ color: colors.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Make sure you've connected your ESPN account first.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="League name"
            value={leagueName}
            onChange={function (e) { setLeagueName(e.target.value) }}
            required
            style={inputStyle}
          />
          <input
            placeholder="ESPN League ID"
            value={leagueId}
            onChange={function (e) { setLeagueId(e.target.value) }}
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={{ ...buttonPrimaryStyle, width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Adding...' : 'Add League'}
          </button>
        </form>
        {error && <p style={{ marginTop: 16, color: colors.danger, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  )
}
