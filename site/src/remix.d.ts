interface Env {
	API: Fetcher;

	CF_PAGES_BRANCH: string;
	CF_PAGES_URL: string;
}

interface BlobParams {
	project?: string;
	releaseChannel?: string;
}

interface DataFunctionArgs {
	request: Request;
	context: Env;
	params: BlobParams;
}

type LoaderFunction<T> = (args: DataFunctionArgs) => Promise<Response> | Response | Promise<T> | T;
