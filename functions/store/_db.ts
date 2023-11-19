export type DbResult<T> = DbResultSuccess<T> | DbResultFail;

interface DbResultSuccess<T> {
	success: true;
	data: T;
}

interface DbResultFail {
	success: false;
	internalError: string;
}

export async function queryRow<T>(DB: D1Database, query: string, ...args: unknown[]): Promise<DbResult<T | null>> {
	try {
		const result = await DB.prepare(query).bind(...args).first<T>();
		return { success: true, data: result };
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return { success: false, internalError: e.message + ' - ' + e.cause };
	}
}

export async function queryRows<T>(DB: D1Database, query: string, ...args: unknown[]): Promise<DbResult<T[]>> {
	try {
		const result = await DB.prepare(query).bind(...args).all<T>();
		// const result = await ps.bind(args).all<T>();
		if (result.error) {
			return { success: false, internalError: result.error };
		}
		if (!result.results) {
			return { success: false, internalError: 'Results are not defined!' };
		}

		return { success: true, data: result.results };
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return { success: false, internalError: e.message + ' - ' + e.cause };
	}
}

export async function run<T>(DB: D1Database, query: string, ...args: unknown[]): Promise<DbResult<D1Result<T>>> {
	try {
		const ps = DB.prepare(query);
		const result = await ps.bind(...args).run<T>();
		return { success: true, data: result };
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return { success: false, internalError: e.message + ' - ' + e.cause };
	}
}
