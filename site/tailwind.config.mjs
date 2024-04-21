import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			textColor: {
				default: colors.gray['400'],
				primary: colors.gray['300'],
			},
			borderColor: {
				// border-zinc-600 hover:border-zinc-400
				default: colors.zinc['600'],
				hover: colors.zinc['400'],
			},
			backgroundColor: {
				default: colors.zinc['900'],
				secondary: colors.zinc['800'],
				lighter: colors.zinc['700'],
			},
		},
	},
	plugins: [],
};
