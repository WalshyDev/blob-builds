import { z } from 'zod';
import { success } from '~/api/api';
import { toProjectResponse } from '~/api/response';
import ProjectStore from '~/store/ProjectStore';
import { Ctx } from '~/types/hono';

export const searchSchema = z.object({
	query: z.string({
		required_error: 'query is required',
		invalid_type_error: 'query must be a string',
	})
		.max(100, 'query needs to be at most 100 characters'),
});

export type SearchBody = z.infer<typeof searchSchema>;

// POST /api/search
export async function postSearch(_: Ctx, body: SearchBody) {
	const projects = await ProjectStore.getProjectsWithSearchTerm(body.query);

	const projectResponses: ProjectResponse[] = [];
	for (const project of projects) {
		projectResponses.push(toProjectResponse(project, project.defaultReleaseChannel));
	}

	return success('Success', projectResponses);
}
