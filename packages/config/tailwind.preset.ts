/**
 * Ananta — shared Tailwind preset (warm academic palette, confirmed 2026-05-29)
 *
 * Use this preset in every Ananta surface so the brand stays cohesive.
 * Previous indigo+teal+saffron AND pink-led attempts are deprecated.
 */
import type { Config } from 'tailwindcss';

export const anantaPreset: Partial<Config> = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Inter', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ananta: {
          // backgrounds
          bg: '#0A1F1C',       // deepest emerald-black
          'bg-2': '#0F2A26',
          'bg-3': '#142E2A',
          cream: '#FAF5EB',
          'cream-2': '#FEF3C7',

          // brand
          amber: '#F59E0B',
          'amber-deep': '#D97706',
          emerald: '#10B981',
          'emerald-deep': '#059669',
          terracotta: '#C2410C',
          walnut: '#78350F',
          sage: '#84CC16',
          copper: '#A16207',
          gold: '#CA8A04',
        },
        // teacher colors — all warm/earthy for cohesion
        praketa: '#F59E0B',  // amber — Maths
        vihaan: '#10B981',   // emerald — Science
        adhvara: '#C2410C',  // terracotta — Social
        harini: '#CA8A04',   // deep gold — Kannada
        anika: '#84CC16',    // sage — English
        amita: '#A16207',    // copper — Hindi
      },
      boxShadow: {
        soft: '0 6px 16px -8px rgba(10, 31, 28, .35), 0 4px 8px -6px rgba(10, 31, 28, .18)',
        pop: '0 14px 40px -12px rgba(245, 158, 11, .35), 0 4px 12px -6px rgba(245, 158, 11, .20)',
        deep: '0 24px 60px -20px rgba(10, 31, 28, .65)',
        'amber-ring': '0 0 0 1px rgba(250, 245, 235, .08), 0 30px 90px -30px rgba(245, 158, 11, .45)',
      },
      animation: {
        'blob-float': 'blobFloat 18s ease-in-out infinite',
        'float-soft': 'floatSoft 4s ease-in-out infinite',
        blink: 'blink 5s infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-amber': 'pulseAmber 2.4s ease-in-out infinite',
        'pop-in': 'pop .45s ease-out both',
      },
      keyframes: {
        blobFloat: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(40px,-30px) scale(1.08)' },
          '66%': { transform: 'translate(-30px,20px) scale(0.95)' },
        },
        floatSoft: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blink: {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '94%, 98%': { transform: 'scaleY(0.1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseAmber: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, .55)' },
          '50%': { boxShadow: '0 0 0 16px rgba(245, 158, 11, 0)' },
        },
        pop: {
          '0%': { transform: 'scale(.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
};

export default anantaPreset;
