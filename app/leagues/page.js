'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  pageStyle,
  containerStyle,
  backLinkStyle,
  cardStyle,
} from '../../lib/theme'

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeagues() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('user_id', userData.user.id)

      if (!error) setLeagues(data)
      setLoading(false)
    }

    loadLeagues()
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
        <a href="/" style={backLinkStyle}>
          Back home
        </a>
        <h1 style={{ marginTop: 10, marginBottom: 4 }}>Your Leagues</h1>

        {leagues.length === 0 ? (
          <div
            style={{
              border: '1px dashed #263140',
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
              color: '#5A6472',
              marginTop: 20,
            }}
          >
            No leagues yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            {leagues.map(function (league) {
              return (
                <a key={league.id} href={'/leagues/' + league.id} style={{ ...cardStyle, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{league.name}</div>
                  <div style={{ color: '#8A94A3', fontSize: 13, marginTop: 2 }}>
                    {league.sport} - {league.platform}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
