import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { ViteDevServer } from 'vite';

export default (options: Options) => {
	const apiProxy = createProxyMiddleware(options);

	return {
		name: 'proxy',
		hooks: {
			'astro:server:setup': ({ server }: { server: ViteDevServer }) => {
				server.middlewares.use(apiProxy);
			},
		},
	};
};
