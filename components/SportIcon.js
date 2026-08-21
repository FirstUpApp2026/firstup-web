import { colors } from '../lib/theme'

const icons = {
  NFL: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.6">
      <ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(-30 12 12)" />
      <line x1="7" y1="14" x2="17" y2="10" />
    </svg>
  ),
  NBA: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" />
    </svg>
  ),
  MLB: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M6 5c3 3 3 11 0 14M18 5c-3 3-3 11 0 14" />
    </svg>
  ),
}

export default function SportIcon({ sport }) {
  return icons[sport] || null
}
