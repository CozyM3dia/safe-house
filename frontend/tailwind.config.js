/* global require */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Theme tokens — values are switched by html[data-theme] ──
        bg: {
          DEFAULT: 'hsl(var(--safe-bg) / <alpha-value>)',
          surface: 'hsl(var(--safe-bg-surface) / <alpha-value>)',
          elevated: 'hsl(var(--safe-bg-elevated) / <alpha-value>)',
        },
        text: {
          primary: 'hsl(var(--safe-text-primary) / <alpha-value>)',
          secondary: 'hsl(var(--safe-text-secondary) / <alpha-value>)',
          muted: 'hsl(var(--safe-text-muted) / <alpha-value>)',
        },
        risk: {
          safe: '#10b981',
          moderate: '#f59e0b',
          danger: '#ef4444',
        },
        accent: {
          DEFAULT: 'hsl(var(--safe-accent) / <alpha-value>)',
          hover: 'hsl(var(--safe-accent-hover) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Red Hat Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Azeret Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Red Hat Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Red Hat Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        data: ['"Azeret Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        'content-show': 'content-show 240ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-dropdown": "fade-in-dropdown 0.15s ease-out forwards",
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'content-show': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)', filter: 'blur(4px)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-dropdown": {
          from: { opacity: "0", transform: "translateY(-2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        glass: '0 2px 16px rgba(0, 0, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.28)',
        glow: '0 0 20px rgba(212, 149, 106, 0.35)',
        'glow-safe': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.35)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
