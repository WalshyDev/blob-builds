import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	base: '/docs',
	integrations: [
		starlight({
			title: 'Blob Builds Docs',
			social: {
				github: 'https://github.com/WalshyDev/blob-builds',
			},
			sidebar: [
				{
					label: 'API',
					items: [
						{ label: 'Reference', link: '/' },
						{ label: 'Errors', link: '/errors/' },
					],
				},
				{
					label: 'Project',
					autogenerate: { directory: 'project' },
				},
			],
		}),
	],
});
