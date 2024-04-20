import { _fetch } from '~/api/api';
import type { APIContext } from 'astro';

export async function GET({ request, locals }: APIContext) {
	try {
		const url = new URL(request.url);

		// Point to API
		console.log('Requesting dl - fetching ' + url.toString());

		return _fetch(locals, url.pathname, request);
	} catch(e) {
		console.error(e);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return Response.json({ error: e.message, stack: e.stack.split('\n') });
	}
}
