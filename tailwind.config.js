/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                lime: {
                    50: '#f7fee7',
                    100: '#ecfccb',
                    200: '#d9f99d',
                    300: '#bef264',
                    400: '#a3e635',
                    500: '#84cc16',
                    600: '#65a30d',
                    700: '#4d7c0f',
                    800: '#3f6212',
                    900: '#365314',
                },
                dark: {
                    950: '#000000',
                    900: '#0a0a0a',
                    850: '#0f0f0f',
                    800: '#141414',
                    750: '#1a1a1a',
                    700: '#1f1f1f',
                    600: '#2a2a2a',
                    500: '#404040',
                    400: '#525252',
                    300: '#737373',
                    200: '#a3a3a3',
                    100: '#d4d4d4',
                },
            },
            fontFamily: {
                display: [
                    'Inter',
                    'SF Pro Display',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'sans-serif',
                ],
                sans: [
                    'Inter',
                    'SF Pro Text',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'sans-serif',
                ],
                mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
            },
            fontSize: {
                '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
                xs: ['0.75rem', { lineHeight: '1rem' }],
                sm: ['0.875rem', { lineHeight: '1.25rem' }],
                base: ['1rem', { lineHeight: '1.5rem' }],
                lg: ['1.125rem', { lineHeight: '1.75rem' }],
                xl: ['1.25rem', { lineHeight: '1.875rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
                '5xl': ['3rem', { lineHeight: '3rem' }],
            },
            boxShadow: {
                glow: '0 0 40px rgba(101, 163, 13, 0.1), 0 0 20px rgba(101, 163, 13, 0.06)',
                'glow-lg':
                    '0 0 60px rgba(101, 163, 13, 0.15), 0 0 30px rgba(101, 163, 13, 0.1)',
                card: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
                'card-md':
                    '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                'card-lg':
                    '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                'card-xl':
                    '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                'inner-glow': 'inset 0 0 20px rgba(163, 230, 53, 0.05)',
            },
            spacing: {
                18: '4.5rem',
                88: '22rem',
                128: '32rem',
            },
            borderRadius: {
                '4xl': '2rem',
            },
        },
    },
    plugins: [],
};
