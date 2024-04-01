import type { Env } from '../src/types/hono';

declare module 'cloudflare:test' {
	interface ProvidedEnv extends Env {}
}
