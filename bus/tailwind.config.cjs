/** Bus · Pametni Karlovac — Tailwind config
 *  Boje/veličine/oblici dolaze iz zajedničkog preseta (shared/tokens).
 *  NIKAD ne hardkodiraj hexove ni px veličine u komponentama.
 */
module.exports = {
  presets: [require('../shared/tokens/tailwind-preset.cjs')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Boje linija — bus-specifično; prijedlog za prelazak u shared/ (vidi TODO.md)
        'line-1': 'var(--pk-line-1)',
        'line-2': 'var(--pk-line-2)',
        'line-3': 'var(--pk-line-3)',
        'line-4': 'var(--pk-line-4)',
        'line-5': 'var(--pk-line-5)',
        'line-6': 'var(--pk-line-6)',
        'line-7': 'var(--pk-line-7)',
        'line-8': 'var(--pk-line-8)',
      },
    },
  },
};
