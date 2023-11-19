export const onRequest: PagesFunction<Env> = async ({ next }) => {
	try {
		return await next();
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return Response.json({
			error: 'Internal erorr occurred!',
			message: (e as Error).message,
			stack: (e as Error).stack,
		}, { status: 500 });
	}
};
