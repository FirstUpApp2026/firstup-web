'use client'

import { pageStyle, containerStyle, colors } from '../../lib/theme'
import Header from '../../components/Header'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const routes = [
  { path: '/', label: 'Homepage' },
  { path: '/login', label: 'Log in' },
  { path: '/signup', label: 'Sign up' },
  { path: '/leagues', label: 'My leagues' },
  { path: '/connect/espn', label: 'Connect ESPN' },
  { path: '/connect/espn/add-league', label: 'Add an ESPN league' },
]

export default function SitemapPage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <Header user={user} />
        <h1 style={{ marginTop: 0, marginBottom: 16 }}>Site map</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {routes.map(function (route) {
            return (
              <a
              
                key={route.path}
                href={route.path}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: colors.card,
                  border: '1px solid ' + colors.cardBorder,
                  borderRadius: 8,
                  color: colors.text,
                  textDecoration: 'none',
                }}
              >
                {route.label}
                <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 8 }}>
                  {route.path}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
