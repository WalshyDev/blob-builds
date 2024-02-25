import { Context } from 'hono';
import { Toucan } from 'toucan-js';

import type { ZodError } from 'zod';
import type { User } from '~/store/schema';

export type Environment = 'test' | 'dev' | 'staging' | 'production';

export type Env = {
	ENVIRONMENT: Environment;
	SENTRY_DSN: string;
	BUILDS_WEBHOOK?: string;
	DISCORD_BOT_TOKEN?: string;

	DB: D1Database;
	R2: R2Bucket;
	AE: AnalyticsEngineDataset;
}

export type Variables = {
	env: Environment;
	user: User;
	userId: number;
	sentry: Toucan;
	requestStartTime: number;
}

export type Ctx = Context<{ Bindings: Env, Variables: Variables }>;

export type Hook<T> = { success: true; data: T } | { success: false; error: ZodError };
