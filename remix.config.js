/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	devServerBroadcastDelay: 1000,
	ignoredRouteFiles: ['**/.*'],
	server: './server.ts',
	serverBuildPath: 'functions/[[path]].js',
	serverConditions: ['worker'],
	serverDependenciesToBundle: 'all',
	serverMainFields: ['browser', 'module', 'main'],
	serverMinify: true,
	serverModuleFormat: 'esm',
	serverPlatform: 'neutral',
	tailwind: true,
	appDirectory: 'src',
	mdx: async () => {
		const [rehypeHighlight] = await Promise.all([
			import('rehype-highlight').then((mod) => mod.default),
		]);
		return {
			rehypePlugins: [rehypeHighlight],
		};
	},
};
