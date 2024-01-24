import { env } from 'node:process';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	integrations: [tailwind(), react()],
	adapter: cloudflare({
		runtime: {
			mode: 'local',
			type: 'pages',
			bindings: {
				API_URL: {
					type: 'env',
					value: env.API_URL,
				},
				// API: {
				// 	type: 'service',
				// },
			},
		},
	}),
});
