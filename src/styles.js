/* ═══════════════════════════════════════════════════════════════
   AI COUNCIL — SHARED STYLE CONSTANTS  (src/styles.js)

   PURPOSE
   -------
   This file holds style objects that are:
     1. Static (no runtime variables like `member.color`)
     2. Reused across multiple components

   RULE OF THUMB
   -------------
   ✅  Put here → same style object copied in 2+ components
   ✅  Put here → static values only (strings, numbers)
   ❌  Keep inline → anything using props/state (e.g. `color`, `isActive`)
   ❌  Keep in index.css → keyframes, resets, pseudo-selectors

   IMPORT USAGE
   ------------
   import { formStyles, layoutStyles, textStyles, tokens } from './styles';
═══════════════════════════════════════════════════════════════ */

/* ── Design tokens ───────────────────────────────────────────── */
export const tokens = {
  // Brand colours
  primary:    '#a78bfa',
  secondary:  '#60a5fa',
  success:    '#34d399',
  warning:    '#f59e0b',
  danger:     '#f87171',

  // Backgrounds
  bgBase:     '#06060d',
  bgPanel:    '#0c0c18',
  bgCard:     'rgba(255,255,255,0.025)',
  bgInput:    'rgba(255,255,255,0.04)',
  bgOverlay:  'rgba(0,0,0,0.25)',

  // Borders
  borderSubtle:  'rgba(255,255,255,0.06)',
  borderMedium:  'rgba(255,255,255,0.09)',
  borderStrong:  'rgba(255,255,255,0.1)',

  // Text
  textPrimary:   '#e8e6f0',
  textSecondary: '#aaa',
  textMuted:     '#666',
  textFaint:     '#444',

  // Radius
  radiusSm: 6,
  radiusMd: 8,
  radiusLg: 12,
  radiusXl: 14,

  // Font sizes
  fontXs:  10,
  fontSm:  11,
  fontMd:  13,
  fontLg:  15,
  fontXl:  17,
};

/* ── Form elements ───────────────────────────────────────────── */
export const formStyles = {
  /** Standard text input / select / textarea */
  input: {
    width:        '100%',
    background:   tokens.bgInput,
    border:       `1px solid ${tokens.borderStrong}`,
    borderRadius: tokens.radiusMd,
    padding:      '10px 13px',
    color:        tokens.textPrimary,
    fontSize:     14,
    fontFamily:   'inherit',
  },

  /** ALL-CAPS field label above inputs */
  label: {
    display:       'block',
    fontSize:      tokens.fontSm,
    color:         tokens.textMuted,
    marginBottom:  7,
    letterSpacing: 0.8,
    fontWeight:    600,
    textTransform: 'uppercase',
  },

  /** Section divider line between form blocks */
  divider: {
    height:     1,
    background: tokens.borderSubtle,
    margin:     '18px 0',
  },
};

/* ── Layout / structural ─────────────────────────────────────── */
export const layoutStyles = {
  /** Full-page container */
  page: {
    minHeight:   '100vh',
    background:  tokens.bgBase,
    color:       tokens.textPrimary,
    fontFamily:  '"Syne", "DM Sans", sans-serif',
  },

  /** Sticky top navigation bar */
  header: {
    padding:        '14px 24px',
    borderBottom:   `1px solid ${tokens.borderSubtle}`,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    position:       'sticky',
    top:            0,
    background:     'rgba(6,6,13,0.97)',
    backdropFilter: 'blur(12px)',
    zIndex:         10,
  },

  /** Centered content well */
  contentWell: {
    maxWidth: 680,
    margin:   '0 auto',
    padding:  '48px 24px',
  },

  /** Two-column deliberation split */
  splitPane: {
    display:             'grid',
    gridTemplateColumns: '1fr 370px',
    gap:                 18,
    alignItems:          'start',
  },

  /** Manage / add-member side panel */
  sidePanel: {
    position:   'fixed',
    top:        0,
    right:      0,
    bottom:     0,
    width:      500,
    zIndex:     50,
    background: tokens.bgPanel,
    borderLeft: `1px solid ${tokens.borderSubtle}`,
    overflowY:  'auto',
    animation:  'slideInRight 0.25s ease',
    boxShadow:  '-20px 0 60px rgba(0,0,0,0.6)',
  },

  /** Semi-transparent backdrop behind side panel */
  backdrop: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.55)',
    zIndex:         40,
    backdropFilter: 'blur(3px)',
    animation:      'fadeIn 0.2s ease',
  },
};

/* ── Cards & containers ──────────────────────────────────────── */
export const cardStyles = {
  /** Generic dark card */
  base: {
    background:   tokens.bgCard,
    borderRadius: tokens.radiusLg,
    border:       `1px solid ${tokens.borderSubtle}`,
    padding:      '13px 16px',
    position:     'relative',
    overflow:     'hidden',
  },

  /** Expanding form panel (add member / save config) */
  formPanel: {
    background:   'rgba(255,255,255,0.02)',
    borderRadius: tokens.radiusXl,
    padding:      26,
    marginTop:    14,
    animation:    'slideDown 0.2s ease',
  },

  /** Info / notice box — green tint */
  infoBox: {
    padding:      '9px 13px',
    background:   'rgba(52,211,153,0.05)',
    border:       `1px solid rgba(52,211,153,0.15)`,
    borderRadius: tokens.radiusMd,
    fontSize:     tokens.fontSm,
    color:        '#6ee7b7',
    lineHeight:   1.5,
  },

  /** Warning box — amber tint */
  warnBox: {
    padding:      '9px 13px',
    background:   'rgba(245,158,11,0.07)',
    border:       `1px solid rgba(245,158,11,0.2)`,
    borderRadius: tokens.radiusMd,
    fontSize:     tokens.fontSm,
    color:        '#d4a44e',
  },

  /** Error box — red tint */
  errorBox: {
    padding:      '9px 12px',
    background:   'rgba(248,113,113,0.07)',
    border:       `1px solid rgba(248,113,113,0.2)`,
    borderRadius: tokens.radiusMd,
    color:        '#fca5a5',
    fontSize:     13,
  },
};

/* ── Typography ──────────────────────────────────────────────── */
export const textStyles = {
  /** Section label — ALL CAPS small tracking */
  sectionLabel: {
    fontSize:      tokens.fontSm,
    color:         tokens.textFaint,
    letterSpacing: 1.5,
    fontWeight:    700,
    textTransform: 'uppercase',
  },

  /** Monospace model name / code */
  mono: {
    fontFamily: 'monospace',
    fontSize:   tokens.fontSm,
  },

  /** Response body text — serif for readability */
  responseBody: {
    fontSize:    14,
    color:       '#d1cce0',
    lineHeight:  1.85,
    whiteSpace:  'pre-wrap',
    fontFamily:  'Georgia, serif',
  },

  /** Query display — italic serif pill */
  queryText: {
    fontSize:    13,
    color:       '#c4b8f0',
    fontFamily:  'Georgia, serif',
    fontStyle:   'italic',
    lineHeight:  1.4,
  },

  /** Verdict body text */
  verdictBody: {
    fontSize:   14,
    color:      '#ddd8f0',
    lineHeight: 1.9,
    whiteSpace: 'pre-wrap',
    fontFamily: 'Georgia, serif',
    animation:  'fadeIn 0.3s ease',
  },
};

/* ── Buttons ─────────────────────────────────────────────────── */
export const buttonStyles = {
  /** Ghost button — subtle border, no fill */
  ghost: {
    background: 'none',
    border:     `1px solid ${tokens.borderMedium}`,
    borderRadius: tokens.radiusMd,
    color:      tokens.textSecondary,
    cursor:     'pointer',
    fontSize:   13,
    padding:    '7px 13px',
  },

  /** Dashed add-item button */
  dashed: {
    width:        '100%',
    padding:      11,
    borderRadius: tokens.radiusMd,
    border:       `1px dashed rgba(167,139,250,0.3)`,
    background:   'rgba(167,139,250,0.04)',
    color:        '#9f7aea',
    cursor:       'pointer',
    fontSize:     13,
    fontWeight:   600,
  },

  /** Icon-sized square action button */
  iconSquare: {
    width:        30,
    height:       30,
    borderRadius: 7,
    border:       `1px solid ${tokens.borderSubtle}`,
    background:   'transparent',
    color:        tokens.textMuted,
    cursor:       'pointer',
    fontSize:     13,
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
  },
};

/* ── Skeleton / placeholder lines ───────────────────────────── */
export const skeletonLine = (width = '80%', opacity = 0.25) => ({
  height:       9,
  borderRadius: 5,
  background:   'rgba(255,255,255,0.1)',
  width,
  opacity,
});

export const skeletonLinePurple = (width = '80%', delay = 0) => ({
  height:           9,
  borderRadius:     5,
  background:       'rgba(167,139,250,0.15)',
  width,
  animation:        'pulse 1.2s ease-in-out infinite',
  animationDelay:   `${delay}s`,
});

