import type { APIContext } from 'astro';

export async function ALL({ request, locals }: APIContext): Promise<Response> {
	// return new Response('{}', { headers: { 'content-type': 'application/json' } });

	// TODO: Debug
	// Astro is failing if you pass a Request object directly to fetch
	// Astro also seems to be failing on the Response class...
	const res = await locals.runtime.env.API.fetch(request.url, request);
	console.log(`[api route] ${request.url} => ${res.status}`, res);
	return res;
}
