/**
 * KeepGoing Design Tokens
 *
 * Inline style で繰り返し使われる値を定数化。
 * CSS変数 (index.css) と対になる TS 側のトークン。
 */

/* ─── Font ─────────────────────── */

export const FONT = {
    body: "'Noto Sans JP', sans-serif",
    heading: "'Outfit', sans-serif",
    mono: "'JetBrains Mono', monospace",
} as const;

/* ─── Color ────────────────────── */

export const COLOR = {
    // Text
    dark: '#2D3436',
    text: '#636E72',
    muted: '#8395A7',
    light: '#B2BEC3',

    // Primary
    primary: '#2BBAA0',
    primaryDark: '#24A08A',

    // Semantic
    danger: '#E17055',
    info: '#0984E3',
    purple: '#8B5CF6',
    pink: '#E84393',
    gold: '#FDCB6E',

    // Background
    bgLight: '#F8F9FA',
    bgMuted: '#F0F3F5',
    bgMint: '#E8F8F0',
    bgPeach: '#FFF5F0',

    // UI
    white: '#FFFFFF',
    disabled: '#DFE6E9',
    border: 'rgba(0,0,0,0.05)',
} as const;

/* ─── Font Size ────────────────── */

export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
} as const;

/* ─── Spacing ──────────────────── */

export const SPACE = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
} as const;

/* ─── Border Radius ────────────── */

export const RADIUS = {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
    circle: '50%',
} as const;

/* ─── Z-Index ──────────────────── */

export const Z = {
    base: 0,
    header: 10,
    content: 20,
    footer: 50,
    fab: 51,
    session: 100,
    sheet: 200,
    modal: 1000,
    confirm: 2000,
} as const;

export const SAFE_AREA_TOP = 'var(--safe-area-top)';
export const SAFE_AREA_BOTTOM = 'var(--safe-area-bottom)';
export const SCREEN_PADDING_X = 20;
export const SCREEN_PADDING_X_CSS = 'var(--screen-padding-x)';
export const SCREEN_HEADER_TOP = 'var(--screen-header-top)';
export const SCREEN_BOTTOM_PADDING = 'var(--screen-bottom-padding)';
export const SCREEN_BOTTOM_WITH_FOOTER = 'var(--screen-bottom-with-footer)';
export const SCREEN_BOTTOM_WITH_FAB = `calc(${SCREEN_BOTTOM_WITH_FOOTER} + 18px)`;
export const HEADER_ICON_BUTTON_SIZE = 44;

export const BOTTOM_NAV_HEIGHT = 56;
export const FLOATING_UI_BOTTOM = `calc(${BOTTOM_NAV_HEIGHT}px + ${SAFE_AREA_BOTTOM} + 16px)`;
export const FLOATING_UI_TOP = `calc(${SAFE_AREA_TOP} + 16px)`;

/* ─── Common Style Mixins ──────── */

/** 標準テキスト: Noto Sans JP */
export const textBase: React.CSSProperties = {
    fontFamily: FONT.body,
    color: COLOR.dark,
};

/** 見出しテキスト: Outfit */
export const textHeading: React.CSSProperties = {
    fontFamily: FONT.heading,
    fontWeight: 700,
    color: COLOR.dark,
};

/** モノスペース（タイマー等） */
export const textMono: React.CSSProperties = {
    fontFamily: FONT.mono,
};

/** プライマリボタン */
export const btnPrimary: React.CSSProperties = {
    fontFamily: FONT.body,
    fontWeight: 700,
    background: `linear-gradient(135deg, ${COLOR.primary}, ${COLOR.primaryDark})`,
    color: COLOR.white,
    border: 'none',
    borderRadius: RADIUS.lg,
    cursor: 'pointer',
    padding: '14px 0',
    fontSize: FONT_SIZE.lg,
};

/** キャンセル/セカンダリボタン */
export const btnSecondary: React.CSSProperties = {
    fontFamily: FONT.body,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.7)',
    color: COLOR.text,
    border: 'var(--glass-border-subtle)',
    borderRadius: RADIUS.lg,
    cursor: 'pointer',
    padding: '14px 0',
    fontSize: FONT_SIZE.md,
};

/** 危険ボタン */
export const btnDanger: React.CSSProperties = {
    fontFamily: FONT.body,
    fontWeight: 700,
    background: COLOR.danger,
    color: COLOR.white,
    border: 'none',
    borderRadius: RADIUS.lg,
    cursor: 'pointer',
    padding: '14px 0',
    fontSize: FONT_SIZE.lg,
};

/** 無効化ボタン */
export const btnDisabled: React.CSSProperties = {
    background: COLOR.disabled,
    color: COLOR.light,
    cursor: 'not-allowed',
};

/** フルスクリーンオーバーレイ（モーダル背景） */
export const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--overlay-bg)',
    backdropFilter: 'blur(var(--overlay-blur))',
    WebkitBackdropFilter: 'blur(var(--overlay-blur))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

/** インプットフィールド */
export const inputField: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
    padding: '14px 18px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(248,249,250,0.8)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    outline: 'none',
    width: '100%',
};
