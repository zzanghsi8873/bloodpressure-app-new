import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 혈압 앱 전용 다크 테마 컬러 팔레트
        primary: {
          500: '#FF5400', // 주황색 포인트 컬러
          400: '#FF5400CC', // Hover 상태
          600: '#E64C00', // Active 상태
        },
        neutral: {
          900: '#000000', // 메인 배경
          800: '#1A1A1A', // 카드 배경
          700: '#333333', // 보더
          600: '#4D4D4D', // 비활성 요소
          400: '#999999', // 보조 텍스트
          300: '#B3B3B3', // Muted 텍스트
          200: '#CCCCCC', // 연한 텍스트
          100: '#FFFFFF', // 메인 텍스트
        },
        foreground: 'var(--color-foreground)',
        'foreground-muted': 'var(--color-foreground-muted)',
        background: 'var(--color-background)',
        'background-secondary': 'var(--color-background-secondary)',
        border: 'var(--color-border)',
        // 혈압 상태별 컬러
        bp: {
          normal: '#22C55E', // 정상
          elevated: '#EAB308', // 높음
          high: '#EF4444', // 고혈압
          'very-high': '#DC2626', // 위험
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        },
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '900' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', fontWeight: '900' }],
        'display-sm': ['2rem', { lineHeight: '1.3', fontWeight: '900' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      screens: {
        'mobile': '320px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      gridTemplateColumns: {
        'mobile': 'repeat(4, 1fr)',
        'tablet': 'repeat(8, 1fr)',
        'desktop': 'repeat(12, 1fr)',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
      },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
