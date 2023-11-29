import { z } from 'zod';
import { success } from '~/api/api';
import * as errors from '~/api/errors';
import { queryRow } from '~/store/_db';
import { Project, ReleaseChannel, User, projectSettings, projects, releaseChannels, users } from '~/store/schema';
import { Ctx } from '~/types/hono';
import { getDb } from '~/utils/storage';

export const dbQuerySchema = z.object({
	whatDo: z.enum(['newUser', 'newProject', 'newReleaseChannel', 'raw']),

	user: z.object({
		userId: z.number(),
		name: z.string(),
		apiToken: z.string(),
	}).optional(),

	project: z.object({
		projectId: z.number(),
		name: z.string(),
		description: z.string(),
		userId: z.number(),
	}).optional(),

	releaseChannel: z.object({
		releaseChannelId: z.number(),
		projectId: z.number(),
		name: z.string(),
		supportedVersions: z.string(),
		dependencies: z.array(z.string()),
		fileNaming: z.string(),
	}).optional(),

	query: z.string().optional(),
});

export type DbQueryBody = z.infer<typeof dbQuerySchema>;

export async function dbQueryHandler(ctx: Ctx, body: DbQueryBody) {
	if (body.whatDo === 'newUser') {
		if (body.user === undefined) {
			return errors.MissingField('user').toResponse(ctx);
		}

		const user = await getDb().insert(users).values(body.user as User).returning().get();

		return success('Success', user);
	} else if (body.whatDo === 'newProject') {
		if (body.project === undefined) {
			return errors.MissingField('project').toResponse(ctx);
		}

		const project = await getDb().insert(projects).values(body.project as Project).returning().get();
		await getDb().insert(projectSettings).values({ projectId: project.projectId }).run();

		return success('Success', project);
	}  else if (body.whatDo === 'newReleaseChannel') {
		if (body.releaseChannel === undefined) {
			return errors.MissingField('releaseChannel').toResponse(ctx);
		}

		const releaseChannel = await getDb().insert(releaseChannels)
			.values(body.releaseChannel as ReleaseChannel)
			.returning()
			.get();

		return success('Success', releaseChannel);
	} else if (body.whatDo === 'raw') {
		if (body.query === undefined) {
			return errors.MissingField('query').toResponse(ctx);
		}

		const result = await queryRow(ctx.env.DB, body.query);

		return success('Success', result);
	} else {
		return errors.MissingField('whatDo').toResponse(ctx);
	}
}
