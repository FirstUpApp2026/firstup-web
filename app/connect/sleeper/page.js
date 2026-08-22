'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { pageStyle, containerStyle, inputStyle, buttonPrimaryStyle, colors } from '../../../lib/theme'
import Header from '../../../components/Header'

export default function ConnectSleeperPage() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
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
    if (!user || !username.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/sleeper/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        sleeper_username: username.trim(),
      }),
    })
    const json = await res.json()

    if (json.error) {
      setError(json.error)
      setLoading(false)
    } else {
      router.push('/connect/sleeper/add-league')
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, maxWidth: 400 }}>
        <Header user={user} />
        <h1 style={{ marginTop: 0, marginBottom: 4 }}>Connect Sleeper</h1>
        <p style={{ color: colors.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
          Enter your Sleeper username. Sleeper doesn't require a password or login here since your leagues are public by username.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Sleeper username"
            value={username}
            onChange={function (e) { setUsername(e.target.value) }}
            required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={{ ...buttonPrimaryStyle, width: '100%', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
        {error && <p style={{ marginTop: 16, color: colors.danger, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  )
}
