/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3B82F6',
                    dark: '#2563EB',
                    light: '#60A5FA',
                },
                secondary: {
                    DEFAULT: '#8B5CF6',
                    dark: '#7C3AED',
                    light: '#A78BFA',
                },
                accent: {
                    DEFAULT: '#10B981',
                    dark: '#059669',
                    light: '#34D399',
                },
            },
            boxShadow: {
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.5)',
                'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'bounce-slow': 'bounce 2s infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
