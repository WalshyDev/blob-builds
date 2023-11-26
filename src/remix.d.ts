interface Env {
	API: Fetcher;
}

interface BlobParam {
	resource: string;
}

interface DataFunctionArgs {
	request: Request;
	context: Env;
	params: BlobParam;
}

type LoaderFunction<T> = (args: DataFunctionArgs) => Promise<Response> | Response | Promise<T> | T;
