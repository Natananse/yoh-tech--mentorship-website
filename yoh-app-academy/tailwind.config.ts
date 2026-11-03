import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { background: '#FAFAF8', foreground: '#222522', primary: '#C74717', muted: '#6B706B', card: '#FFFFFF', secondary: '#E5F1F9', danger: '#B42318' } } }, plugins: [] } satisfies Config;
