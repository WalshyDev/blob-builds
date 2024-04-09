import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const migrations = await readD1Migrations('migrations');

export default defineWorkersConfig({
	plugins: [tsconfigPaths()],
	test: {
		pool: '@cloudflare/vitest-pool-workers',
		coverage: {
			provider: 'istanbul',
			reporter: ['json', 'html'],
		},
		poolOptions: {
			workers: {
				isolatedStorage: true,
				wrangler: {
					configPath: './wrangler.toml',
				},
				miniflare: {
					bindings: {
						ENVIRONMENT: 'test',

						MIGRATIONS: migrations,

						// I'm using envs and right now they aren't supported in these vitest tests
						// sooooo we'll redefine everything (secrets are picked up form .dev.vars correctly)
					},
					d1Databases: ['DB'],
					r2Buckets: ['R2'],
				},
			},
		},
	},
});
