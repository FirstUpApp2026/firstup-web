'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import Logo from './Logo'

export default function Header({ user }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ position: 'relative', marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
        <a href="/" style={{ textDecoration: 'none', justifySelf: 'start' }}>
          <Logo size="small" />
        </a>

        <img src="/eagle-icon.png" alt="" style={{ height: 32, width: 'auto', display: 'block' }} />

        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          style={{
            justifySelf: 'end',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            color: colors.text,
          }}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && user && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 0,
            background: colors.card,
            border: '1px solid ' + colors.cardBorder,
            borderRadius: 10,
            padding: '12px 16px',
            minWidth: 190,
            textAlign: 'right',
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>Welcome Back</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>{user.email}</div>
          <div style={{ borderTop: '1px solid ' + colors.cardBorder, paddingTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <a href="https://x.com/FirstUpApp" target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted, display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <span onClick={handleLogout} style={{ fontSize: 13, color: colors.danger, cursor: 'pointer' }}>
              Log Out
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
