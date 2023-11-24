import { AsyncLocalStorage } from 'node:async_hooks';

import { Toucan } from 'toucan-js';

import { Env } from '~/types/hono';

export interface Store {
	env: Env;
	sentry: Toucan;
}

export const storage = new AsyncLocalStorage<Store>();

export function getStore(): Store {
	// This will always be called within the right context
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return storage.getStore()!;
}
