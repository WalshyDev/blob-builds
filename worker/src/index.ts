import { Hono } from 'hono';
import * as errors from '~/api/errors';
import { postRewriteBuild, rewriteBuildSchema } from '~/handlers/admin/migration/migration';
import { setup, writeAnalytics } from '~/handlers/all';
import {
	getProjectLatestBuild,
	getLatestBuildForReleaseChannel,
	postUploadBuild,
	getAllProjectBuilds,
	getProjectBuildVersion,
	getAllProjectBuildsForReleaseChannel,
} from '~/handlers/builds/build';
import { getDownloadBuild } from '~/handlers/builds/download';
import {
	projectSettingsSchema,
	getProject,
	getProjects,
	newProjectSchema,
	patchProjectSettings,
	postNewProject,
} from '~/handlers/projects/project';
import { dbQueryHandler, dbQuerySchema } from '~/handlers/test/db';
import { testOnlyMiddleware } from '~/handlers/test/middleware';
import { adminOnly } from '~/middleware/admin';
import { auth } from '~/middleware/auth';
import { Ctx } from '~/types/hono';
import jsonValidator from '~/utils/validator/jsonValidator';
import uploadValidator from '~/utils/validator/uploadValidator';

const app = new Hono();

app.use('*', setup);
app.use('*', writeAnalytics);

// Projects
app.get(
	'/api/projects',
	getProjects,
);
app.get(
	'/api/projects/:projectName',
	getProject,
);
// Deprecated, use `/api/builds/:projectName/latest` instead
app.get(
	'/api/projects/:projectName/latest',
	getProjectLatestBuild,
);
// Deprecated, use `/api/builds/:projectName/:releaseChannel/latest` instead
app.get(
	'/api/projects/:projectName/:releaseChannel/latest',
	getLatestBuildForReleaseChannel,
);
// Deprecated, use `/api/builds/:projectName/:releaseChannel/upload` instead
app.post(
	'/api/projects/:projectName/:releaseChannel/upload',
	auth,
	uploadValidator(postUploadBuild),
);
app.post(
	'/api/projects/:projectName/new',
	auth,
	jsonValidator(newProjectSchema, postNewProject),
);
app.patch(
	'/api/projects/:projectName/settings',
	auth,
	jsonValidator(projectSettingsSchema, patchProjectSettings),
);

// Builds
app.get(
	'/api/builds/:projectName',
	getAllProjectBuilds,
);
app.get(
	'/api/builds/:projectName/:releaseChannel',
	getAllProjectBuildsForReleaseChannel,
);
app.get(
	'/api/builds/:projectName/latest',
	getProjectLatestBuild,
);
app.get(
	'/api/builds/:projectName/:releaseChannel/latest',
	getLatestBuildForReleaseChannel,
);
app.get(
	'/api/builds/:projectName/:releaseChannel/:version',
	getProjectBuildVersion,
);
app.post(
	'/api/builds/:projectName/:releaseChannel/upload',
	auth,
	uploadValidator(postUploadBuild),
);

// Downloads
// Deprecated, use `/dl/:projectName/:releaseChannel/latest` instead
app.get(
	'/builds/:projectName/:releaseChannel/latest',
	getDownloadBuild,
);
app.get(
	'/dl/:projectName/:releaseChannel/latest',
	getDownloadBuild,
);
app.get(
	'/dl/:projectName/:releaseChannel/:version',
	getDownloadBuild,
);

// -- Admin --
app.use('/api/admin/*', auth, adminOnly);
// Migration
app.post(
	'/api/admin/migration/rewrite_build',
	uploadValidator(postRewriteBuild, rewriteBuildSchema),
);

app.onError((err, ctx) => errors.InternalError.withError(err).toResponse(ctx as Ctx));
app.notFound((ctx) => errors.RouteNotFound.toResponse(ctx as Ctx));

// Test only
app.use('/__test/*', testOnlyMiddleware);
app.post('/__test/db', jsonValidator(dbQuerySchema, dbQueryHandler));

export default app;
