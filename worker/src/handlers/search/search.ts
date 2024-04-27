import { z } from 'zod';
import { success } from '~/api/api';
import { toProjectResponse } from '~/api/response';
import ProjectStore from '~/store/ProjectStore';
import { Ctx } from '~/types/hono';

export const searchSchema = z.object({
	query: z.string().max(100, 'Query is too long'),
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
