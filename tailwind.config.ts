import type { Config } from 'tailwindcss'

export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				'heading': '#3f3f3f',

				'primary-bg': '#1c1f20',

				'table-heading': '#3f3f3f',
				'table-primary-row': '#595959',
				'table-secondary-row': '#6b6b6b',
				'table-border': '#9f9f9f',
				'table-hover': '#737373',
			}
		},
	},
	plugins: [],
} satisfies Config

