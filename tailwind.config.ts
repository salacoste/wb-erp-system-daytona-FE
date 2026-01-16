import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary red color palette (from front-end-spec)
        primary: {
          DEFAULT: '#E53935', // Main brand color
          dark: '#D32F2F', // Hover states, pressed buttons
          light: '#FFCDD2', // Hover backgrounds, disabled states
          foreground: '#FFFFFF', // Text on primary background
        },
        // Gray scale
        gray: {
          50: '#F5F5F5', // Light backgrounds
          100: '#EEEEEE', // Borders
          200: '#BDBDBD', // Disabled text
          300: '#E0E0E0', // Border color (Story 34.3-FE)
          600: '#757575', // Description text (Story 34.3-FE)
          700: '#424242', // Label text (Story 34.3-FE)
          800: '#424242', // Selected language text (Story 34.3-FE)
        },
        // Telegram color (Story 34.3-FE: Epic 34 Telegram Notifications UI)
        'telegram-blue': '#0088CC', // Telegram brand color for enabled states and switches
        // Semantic colors
        success: {
          DEFAULT: '#4CAF50', // Positive margins
          foreground: '#FFFFFF',
        },
        error: {
          DEFAULT: '#E53935', // Negative margins, errors
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#2196F3', // Primary metrics
          foreground: '#FFFFFF',
        },
        // shadcn/ui color system (via CSS variables)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'ring-offset': 'hsl(var(--ring-offset-background))',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Typography scale from front-end-spec
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        metric: ['32px', { lineHeight: '1.2', fontWeight: '700' }], // Large metric values
        'metric-lg': ['48px', { lineHeight: '1.2', fontWeight: '700' }], // Extra large metrics
      },
      spacing: {
        // Custom spacing scale
        18: '4.5rem', // 72px
        22: '5.5rem', // 88px
      },
      borderRadius: {
        // Border radius from front-end-spec
        DEFAULT: '8px', // Standard border radius
        lg: '12px', // Large border radius
        sm: '4px', // Small border radius
      },
      boxShadow: {
        // Shadow system from front-end-spec
        card: '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      // Story 34.3-FE: Slide-down animation for time picker
      keyframes: {
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 200ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

