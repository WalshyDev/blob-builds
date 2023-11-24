interface Env {
	API: Fetcher;
}

interface DataFunctionArgs {
	request: Request;
	context: Env;
	params: Params;
}

type LoaderFunction<T> = (args: DataFunctionArgs) => Promise<Response> | Response | Promise<T> | T;
