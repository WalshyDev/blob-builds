import { Context } from 'hono';
import { Toucan } from 'toucan-js';

import type { ZodError } from 'zod';

export type Environment = 'test' | 'development' | 'staging' | 'production';

export type Env = {
	ENVIRONMENT: Environment;
	SENTRY_DSN: string;

	DB: D1Database;
	R2: R2Bucket;
}

export type Variables = {
	env: Environment;
	user: User;
	userId: number;
	sentry: Toucan;
}

export type Ctx = Context<{ Bindings: Env, Variables: Variables }>;

export type Hook<T> = { success: true; data: T } | { success: false; error: ZodError };
