export const colors = {
  bg: '#0B0F14',
  card: '#141B24',
  cardBorder: '#1B232D',
  border: '#263140',
  text: '#EDEFF2',
  textMuted: '#8A94A3',
  textFaint: '#5A6472',
  accent: '#F4B740',
  danger: '#F4776A',
  info: '#5FB8E0',
  purple: '#C792EA',
}

export const positionColors = {
  QB: colors.danger,
  RB: colors.accent,
  WR: colors.info,
  TE: colors.purple,
}

export const pageStyle = {
  background: colors.bg,
  minHeight: '100vh',
  color: colors.text,
  fontFamily: 'system-ui, sans-serif',
  display: 'flex',
  justifyContent: 'flex-start',
  flexDirection: 'column',
  alignItems: 'center',
}

export const containerStyle = {
  maxWidth: 500,
  margin: '0 auto',
  padding: '40px 20px',
}

export const backLinkStyle = {
  color: colors.textMuted,
  fontSize: 13,
  textDecoration: 'none',
}

export const sectionHeaderStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: 16,
  marginBottom: 8,
  borderBottom: '1px solid ' + colors.border,
  paddingBottom: 6,
}

export const cardStyle = {
  background: colors.card,
  border: '1px solid ' + colors.cardBorder,
  borderRadius: 8,
  padding: 12,
}

export const inputStyle = {
  flex: 1,
  padding: 8,
  background: colors.card,
  border: '1px solid ' + colors.border,
  borderRadius: 6,
  color: colors.text,
}

export const buttonPrimaryStyle = {
  background: colors.accent,
  border: '1px solid ' + colors.accent,
  color: colors.bg,
  borderRadius: 6,
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}
export const buttonSecondaryStyle = {
  background: 'transparent',
  border: '1px solid ' + colors.border,
  color: colors.text,
  borderRadius: 6,
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}

export const buttonDangerStyle = {
  background: 'transparent',
  border: '1px solid ' + colors.danger,
  color: colors.danger,
  borderRadius: 6,
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}


export const buttonGhostStyle = {
  background: 'transparent',
  border: 'none',
  color: colors.textFaint,
  cursor: 'pointer',
  padding: 4,
  fontSize: 14,
}
export function formatSport(sport) {
  if (!sport) return ''
  const upper = sport.toUpperCase()
  if (upper === 'NFL') return 'NFL'
  return sport
}

export function formatPlatform(platform) {
  if (!platform) return ''
  const lower = platform.toLowerCase()
  if (lower === 'yahoo') return 'yahoo!'
  if (lower === 'espn') return 'ESPN'
  return platform
}
