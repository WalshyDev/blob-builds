import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import proxyMiddleware from './plugins/proxy-middleware';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	integrations: [
		tailwind(),
		react(),
		proxyMiddleware({
			pathFilter: '/api',
			target: 'http://localhost:8787',
			changeOrigin: true,
		}),
	],
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
