import { colors } from '../lib/theme'

export default function Logo({ size = 'large' }) {
  const fontSize = size === 'large' ? 36 : 20

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: size === 'large' ? 32 : 0 }}>
      <span
        style={{
          fontSize: fontSize,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: colors.text,
        }}
      >
        First
      </span>
      <span
        style={{
          fontSize: fontSize,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: colors.accent,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Up
      </span>
    </div>
  )
}
