'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { colors, buttonDangerStyle } from '../lib/theme'
import Logo from './Logo'

export default function Header({ user }) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}
    >
      <a href="/" style={{ textDecoration: 'none' }}>
        <Logo size="small" />
      </a>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Welcome Back</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>{user.email}</div>
          </div>
          <button onClick={handleLogout} style={{ ...buttonDangerStyle, padding: '6px 12px', fontSize: 12 }}>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
