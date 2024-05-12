import { getStore } from '~/utils/storage';
import { timeWindowToChInterval } from '@/time/timewindow';
import { TimeWindow } from '@/types/general';

const ACCOUNT_ID = '4e599df4216133509abaac54b109a647';
const PROD_TABLE = 'blob_builds_downloads';
const DEV_TABLE = 'blob_builds_dev_downloads';

interface AnalyticsOptions {
	projectName: string;
	timeWindow: TimeWindow;
}

const CACHE_KEY_HOST = 'https://analytics.local';

export async function fetchProjectAnalytics(opts: AnalyticsOptions): Promise<Response | null> {
	const store = getStore();
	const cache = caches.default;
	const cacheKey = getCacheKey(`project/${opts.projectName}/${opts.timeWindow}`);

	// Try and match the cache
	const cachedRes = await cache.match(cacheKey);
	if (cachedRes !== undefined) {
		console.log('Hit cache for project analytics -', cacheKey.url);
		return cachedRes;
	}

	// Fetch anaytics
	const res = await query(`
		SELECT
			toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day,
			sum(_sample_interval) AS downloads
		FROM ${store.env.ENVIRONMENT === 'production' ? PROD_TABLE : DEV_TABLE}
		WHERE timestamp >= now() - ${timeWindowToChInterval(opts.timeWindow)}
			AND index1 = '${opts.projectName}'
		GROUP BY day
		ORDER BY day ASC
		FORMAT JSON
	`);

	if (res === null) return null;

	const cacheableResponse = new Response(res.body, res);
	cacheableResponse.headers.set('Cache-Control', 'public, max-age=300');

	// Insert into cache async
	store.ctx.waitUntil(cache.put(cacheKey, cacheableResponse.clone()));

	return cacheableResponse;
}

function getCacheKey(cacheProperties: string) {
	return new Request(`${CACHE_KEY_HOST}/${cacheProperties}`);
}

export async function query(sql: string): Promise<Response | null> {
	const store = getStore();
	store.sentry.addBreadcrumb({
		message: 'Fetching analytics',
		category: 'query',
		data: {
			sql,
		},
	});

	const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`, {
		method: 'POST',
		body: sql,
		headers: {
			'Authorization': `Bearer ${store.env.CLOUDFLARE_API_TOKEN}`,
		},
	});

	if (!res.ok) {
		const body = await res.text();

		console.error(`Failed to fetch analytics, status: ${res.status}`);
		console.error(body);
		store.sentry.addBreadcrumb({
			level: 'error',
			message: `Failed to fetch analytics, status: ${res.status}`,
			data: {
				sql,
				status: res.status,
				body: body,
			},
		});

		return null;
	}

	return res;
}
