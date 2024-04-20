import type { APIContext } from 'astro';

export async function GET({ request, locals }: APIContext) {
	return locals.runtime.env.API.fetch(request);
}
