import { SQLiteColumn, SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core';
import { Columns } from '~/types/db';

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

export async function batch<T = unknown>(
	DB: D1Database,
	query: string,
	...args: unknown[][]
): Promise<DbResult<D1Result<T>[]>> {
	try {
		const statements = [];
		for (const queryArgs of args) {
			const ps = DB.prepare(query).bind(...queryArgs);
			statements.push(ps);
		}

		const result = await DB.batch<T>(statements);
		return { success: true, data: result };
	} catch(e) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return { success: false, internalError: e.message + ' - ' + e.cause };
	}
}

export function selectStar<T extends TableConfig>(
	table: SQLiteTableWithColumns<T>,
): Columns<T> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return Object.fromEntries(
		Object.entries(table)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([_, val]) => val instanceof SQLiteColumn),
	);
}
