import type { APIContext } from 'astro';

export async function GET({ request }: APIContext) {
	try {
		console.log('Requesting dl');

		const url = new URL(request.url);

		// Prefix with /api
		url.pathname = `/api${url.pathname}`;

		return fetch(url, request);
	} catch(e) {
		console.error(e);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return Response.json({ error: e.message, stack: e.stack.split('\n') });
	}
}
