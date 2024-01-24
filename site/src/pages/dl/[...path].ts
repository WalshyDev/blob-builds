import type { APIContext } from 'astro';

export async function GET({ request, locals }: APIContext) {
	try {
		const url = new URL(request.url);

		// Point to API
		// TODO: I should either enforce API_URL or move this to a const
		// (ideally not even need to point to workers.dev but shit is broke)
		url.hostname = locals.runtime.env.API_URL.replace('https://', '')
			?? 'blob-builds-api-production.walshydev.workers.dev';

		console.log('Requesting dl - fetching ' + url.toString());

		return fetch(url, request);
	} catch(e) {
		console.error(e);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return Response.json({ error: e.message, stack: e.stack.split('\n') });
	}
}
