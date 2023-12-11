const API_DOCS = 'blob-builds-docs.pages.dev';

export const onRequest: PagesFunction<Env> = ({ request, env }) => {
	try {
		console.log('Requesting docs');

		// See if this is a preview URL and if so, use the preview hostname
		if (env.CF_PAGES_URL && env.CF_PAGES_BRANCH !== 'main') {
			const branchAlias = generateBranchAlias(env.CF_PAGES_BRANCH);

			const url = new URL(request.url);
			url.hostname = `${branchAlias}.${API_DOCS}`;
			url.pathname = url.pathname.replace('/docs', '');

			request = new Request(url, request);
			request.headers.set('x-host', url.hostname);

			console.log('set hostname to', url.hostname);
		}

		return fetch(request);
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		return Response.json({ error: e.message, stack: e.stack.split('\n') });
	}
};

const invalidCharsRegex = /[^a-z0-9-]/g;
const maxAliasLength = 28;
const alphanum = 'abcdefghijklmnopqrstuvwxyz0123456789';

function generateBranchAlias(branch: string) {
	const normalised = trim(branch.toLowerCase().replace(invalidCharsRegex, '-'), '-');

	if (normalised === '') {
		return 'branch-' + randAlphaNum(10);
	}

	if (normalised.length > maxAliasLength) {
		return normalised.substring(0, maxAliasLength);
	}

	return normalised;
}

function trim(str: string, char: string): string {
	while (str.charAt(0) === char) {
		if (str.length === 1) {
			return '';
		}
		str = str.substring(1);
	}

	while (str.charAt(str.length - 1) === char) {
		if (str.length === 1) {
			return '';
		}
		str = str.substring(0, str.length - 1);
	}

	return str;
}

function randAlphaNum(length: number): string {
	let result: string = '';

	for (let i = 0; i < length; i++) {
		result += alphanum[Math.floor(Math.random() * alphanum.length)];
	}

	return result;
}
