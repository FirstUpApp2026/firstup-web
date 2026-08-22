'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { pageStyle, containerStyle, cardStyle, buttonPrimaryStyle, colors } from '../../../../lib/theme'
import Header from '../../../../components/Header'

export default function AddSleeperLeaguePage() {
  const [user, setUser] = useState(null)
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [addedIds, setAddedIds] = useState([])
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(function () {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }
      setUser(userData.user)

      const res = await fetch('/api/sleeper/leagues?user_id=' + userData.user.id)
      const json = await res.json()

      if (json.error) {
        setError(json.error)
      } else {
        setLeagues(json.leagues)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAdd(league) {
    setAddingId(league.league_id)
    setError('')

    const res = await fetch('/api/sleeper/add-league', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        sleeper_league_id: league.league_id,
        league_name: league.name,
      }),
    })
    const json = await res.json()

    setAddingId(null)

    if (json.error) {
      setError(json.error)
    } else {
      setAddedIds(function (current) { return [...current, league.league_id] })
    }
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ padding: 40 }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, maxWidth: 400 }}>
        <Header user={user} />
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Your Sleeper leagues</h1>
        <p style={{ color: colors.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Pick which leagues to add.
        </p>

        {leagues.length === 0 && (
          <div style={{ border: '1px dashed ' + colors.border, borderRadius: 10, padding: 24, textAlign: 'center', color: colors.textFaint }}>
            No leagues found for this Sleeper account.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leagues.map(function (league) {
            const isAdded = addedIds.indexOf(league.league_id) !== -1
            return (
              <div key={league.league_id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600 }}>{league.name}</div>
                <button
                  onClick={function () { handleAdd(league) }}
                  disabled={isAdded || addingId === league.league_id}
                  style={{ ...buttonPrimaryStyle, padding: '6px 14px', fontSize: 13, opacity: isAdded ? 0.5 : 1 }}
                >
                  {isAdded ? 'Added' : addingId === league.league_id ? 'Adding...' : 'Add'}
                </button>
              </div>
            )
          })}
        </div>

        {error && <p style={{ marginTop: 16, color: colors.danger, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  )
}
