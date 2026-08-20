'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 600, margin: '80px auto', padding: 20 }}>
      <h1>Your Leagues</h1>
      {leagues.length === 0 ? (
        <p>No leagues yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {leagues.map((league) => (
            <li key={league.id} style={{ padding: '12px 0', borderBottom: '1px solid #333' }}>
              <a href={`/leagues/${league.id}`} style={{ fontSize: 18, fontWeight: 600 }}>
                {league.name}
              </a>
              <div style={{ color: '#888', fontSize: 14 }}>{league.sport}</div>
            </li>
          ))}
        </ul>
      )}
      <a href="/" style={{ display: 'inline-block', marginTop: 20 }}>
        ← Back home
      </a>
    </div>
  )
}