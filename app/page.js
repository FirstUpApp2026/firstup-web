'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', padding: 20 }}>
      {user ? (
  <>
    <h1>Welcome back!</h1>
    <p>Logged in as {user.email}</p>
    <a href={`/api/auth/yahoo?user_id=${user.id}`}>
      <button style={{ padding: 10, marginTop: 12, marginRight: 8 }}>
        Connect Yahoo Account
      </button>
    </a>
    <a href="/leagues">
  <button style={{ padding: 10, marginTop: 12, marginRight: 8 }}>
    My Leagues
  </button>
</a>
    <button onClick={handleLogout} style={{ padding: 10, marginTop: 12 }}>
      Log Out
    </button>
  </>
) : (
        <>
          <h1>Welcome to FirstUp</h1>
          <p>
            <a href="/login">Log In</a> or <a href="/signup">Sign Up</a>
          </p>
        </>
      )}
    </div>
  )
}