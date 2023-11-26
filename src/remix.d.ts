interface Env {
	API: Fetcher;
}

interface BlobParams {
	resource?: string;
}

interface DataFunctionArgs {
	request: Request;
	context: Env;
	params: BlobParams;
}

type LoaderFunction<T> = (args: DataFunctionArgs) => Promise<Response> | Response | Promise<T> | T;
