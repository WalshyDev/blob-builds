import { defineConfig as defineViteConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';

const viteConfig = defineViteConfig({
	plugins: [tsconfigPaths()],
});

export default mergeConfig(viteConfig, defineConfig({
	test: {
		retry: 3,
	},
}));
