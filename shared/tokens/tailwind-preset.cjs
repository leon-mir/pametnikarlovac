/**
 * Pametni Karlovac — Tailwind preset
 * Izvor istine: shared/design-system.md + shared/tokens/tokens.css
 *
 * Upotreba u aplikaciji (bus/, proracun/, dogadaji/):
 *   // tailwind.config.cjs
 *   module.exports = {
 *     presets: [require('../shared/tokens/tailwind-preset.cjs')],
 *     content: ['./src/**\/*.{astro,html,js,jsx,ts,tsx}'],
 *   }
 *
 * Boje pokazuju na CSS varijable iz tokens.css — akcent se automatski
 * mijenja po [data-app], veličine teksta po [data-textsize].
 * NIKAD ne hardkodiraj hexove u komponentama.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--pk-primary)',
        bg: 'var(--pk-bg)',
        surface: 'var(--pk-surface)',

        gold: 'var(--pk-gold)',
        'gold-text': 'var(--pk-gold-text)',
        patina: 'var(--pk-patina)',
        'patina-strong': 'var(--pk-patina-strong)',
        roof: 'var(--pk-roof)',
        'roof-strong': 'var(--pk-roof-strong)',
        danger: 'var(--pk-danger)',
        'danger-strong': 'var(--pk-danger-strong)',
        success: 'var(--pk-success)',

        accent: 'var(--pk-accent)',
        'accent-text': 'var(--pk-accent-text)',
        'accent-contrast': 'var(--pk-accent-contrast)',

        text: 'var(--pk-text)',
        'text-muted': 'var(--pk-text-muted)',
        'text-inverse': 'var(--pk-text-inverse)',
        'border-subtle': 'var(--pk-border-subtle)',
        'border-strong': 'var(--pk-border-strong)',

        'river-korana': 'var(--pk-river-korana)',
        'river-kupa': 'var(--pk-river-kupa)',
        'river-mreznica': 'var(--pk-river-mreznica)',
        'river-dobra': 'var(--pk-river-dobra)',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // skaliraju se s [data-textsize] preko --pk-font-scale
        mega: ['var(--pk-fs-mega)', { lineHeight: '1.2', fontWeight: '800' }],
        display: ['var(--pk-fs-display)', { lineHeight: '1.2', fontWeight: '800' }],
        h1: ['var(--pk-fs-h1)', { lineHeight: '1.2', fontWeight: '800' }],
        h2: ['var(--pk-fs-h2)', { lineHeight: '1.2', fontWeight: '600' }],
        h3: ['var(--pk-fs-h3)', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['var(--pk-fs-body-lg)', { lineHeight: '1.5' }],
        body: ['var(--pk-fs-body)', { lineHeight: '1.5' }],
        caption: ['var(--pk-fs-caption)', { lineHeight: '1.5' }],
      },
      borderRadius: {
        sm: 'var(--pk-radius-sm)',
        md: 'var(--pk-radius-md)',
        lg: 'var(--pk-radius-lg)',
        full: 'var(--pk-radius-full)',
      },
      boxShadow: {
        card: 'var(--pk-shadow-card)',
      },
      spacing: {
        tap: 'var(--pk-tap-min)', // min-h-tap / min-w-tap za dodirne mete
      },
      zIndex: {
        header: 'var(--pk-z-header)',
        nav: 'var(--pk-z-nav)',
        banner: 'var(--pk-z-banner)',
        toast: 'var(--pk-z-toast)',
      },
      maxWidth: {
        content: '480px',
        data: '960px',
      },
    },
  },
};
