const DOCS_SITE = '';

export const onRequest: PagesFunction<Env> = ({ request, env }) => {
	return env.API.fetch(request);
};
