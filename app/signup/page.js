'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { pageStyle, containerStyle, inputStyle, buttonPrimaryStyle, colors } from '../../lib/theme'
import Logo from '../../components/Logo'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signUp({ email: email, password: password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account.')
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...containerStyle, maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -20 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <Logo />
          </a>
        </div>
        <p style={{ textAlign: 'center', color: colors.textMuted, marginTop: 0, marginBottom: 24 }}>
          Sleep in. We'll grab the free agent.
        </p>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={function (e) { setEmail(e.target.value) }}
            required
            style={inputStyle}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={function (e) { setPassword(e.target.value) }}
              required
              style={{ ...inputStyle, width: '100%', paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={function () { setShowPassword(!showPassword) }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.textMuted,
                padding: 0,
                display: 'flex',
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.5 5.4A10.4 10.4 0 0 1 12 5c5 0 9 4 10.5 7-.6 1.2-1.5 2.5-2.7 3.6M6.6 6.6C4.3 8 2.7 10 1.5 12c1.5 3 5.5 7 10.5 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7-10.5-7-10.5-7z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
          <button type="submit" style={{ ...buttonPrimaryStyle, width: '100%', marginTop: 8 }}>
            Sign Up
          </button>
        </form>
        {message && <p style={{ marginTop: 16, color: colors.textMuted, fontSize: 14 }}>{message}</p>}
        <p style={{ marginTop: 20, fontSize: 14, color: colors.textMuted }}>
          Already have an account? <a href="/login" style={{ color: colors.accent }}>Log in</a>
        </p>
      </div>
    </div>
  )
}
