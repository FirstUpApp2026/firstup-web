'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ConnectEspnPage() {
  const [swid, setSwid] = useState('')
  const [espnS2, setEspnS2] = useState('')
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  async function handleConnect(e) {
    e.preventDefault()
    if (!userId) return
    setMessage('')

    const { error } = await supabase.from('espn_connections').upsert({
      user_id: userId,
      swid: swid.trim(),
      espn_s2: espnS2.trim(),
    })

    if (error) {
      setMessage('Something went wrong: ' + error.message)
    } else {
      setMessage('ESPN account connected.')
    }
  }

  return (
    <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#EDEFF2', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 20px' }}>
        <a href="/" style={{ color: '#8A94A3', fontSize: 13, textDecoration: 'none' }}>
          Back home
        </a>
        <h1 style={{ marginTop: 10 }}>Connect ESPN</h1>
        <p style={{ color: '#8A94A3', fontSize: 14, lineHeight: 1.5 }}>
          ESPN does not support a login button here. Instead, you will copy two values from
          your own browser after logging into ESPN normally. These values stay private to
          your account and are only used to read your leagues.
        </p>

        <ol style={{ color: '#8A94A3', fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Log into fantasy.espn.com in this same browser</li>
          <li>Open your browser&apos;s developer tools and go to the Cookies section</li>
          <li>Find the cookie named <code>SWID</code> and copy its value</li>
          <li>Find the cookie named <code>espn_s2</code> and copy its value</li>
        </ol>

        <form onSubmit={handleConnect} style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: '#8A94A3' }}>SWID</label>
            <input
              value={swid}
              onChange={(e) => setSwid(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: '#8A94A3' }}>espn_s2</label>
            <input
              value={espnS2}
              onChange={(e) => setEspnS2(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            style={{
              background: '#1B232D',
              border: '1px solid #F4B740',
              color: '#F4B740',
              borderRadius: 6,
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Connection
          </button>
        </form>
        {message && <p style={{ marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: 8,
  marginTop: 4,
  background: '#141B24',
  border: '1px solid #263140',
  borderRadius: 6,
  color: '#EDEFF2',
}