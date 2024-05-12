import { AsyncLocalStorage } from 'node:async_hooks';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { Toucan } from 'toucan-js';
import { Analytics } from '~/analytics/analytics';
import { DownloadAnalytics } from '~/analytics/downloads';
import * as schema from '~/store/schema';
import { Env } from '~/types/hono';

export interface Store {
	env: Env;
	ctx: ExecutionContext;
	sentry: Toucan;
	analytics: Analytics;
	downloadAnalytics: DownloadAnalytics;
	db: DrizzleD1Database<typeof schema>;
}

export const storage = new AsyncLocalStorage<Store>();

export function getStore(): Store {
	// This will always be called within the right context
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return storage.getStore()!;
}

export function getDb() {
	return getStore().db;
}
