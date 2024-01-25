import type { Ctx } from '~/types/hono';

export interface Pagination {
	page: number;
	perPage: number;
	total?: number;
}

const DEFAULT: Pagination = {
	page: 1,
	perPage: 100,
};

export function getPagination(ctx: Ctx): Pagination {
	const url = new URL(ctx.req.raw.url);

	const pagination = { ...DEFAULT };

	if (url.searchParams.has('page')) {
		const page = parseInt(url.searchParams.get('page')!);
		if (!isNaN(page) && page > 0) {
			pagination.page = page;
		}
	}

	if (url.searchParams.has('per_page') || url.searchParams.has('perPage')) {
		const perPage = parseInt(url.searchParams.get('per_page') ?? url.searchParams.get('perPage') ?? '1');
		if (!isNaN(perPage) && perPage > 0) {
			pagination.perPage = perPage;
		}
	}

	return pagination;
}
