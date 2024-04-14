import { Hono } from 'hono';
import * as errors from '~/api/errors';
import { postRewriteBuild, rewriteBuildSchema } from '~/handlers/admin/migration/migration';
import { setup, writeAnalytics } from '~/handlers/all';
import { githubCallback, githubInitiate } from '~/handlers/auth/oauth/github';
import {
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
	patchProjectSchema,
	patchProject,
	patchProjectReleaseChannelSchema,
	patchReleaseChannel,
} from '~/handlers/projects/project';
import { getUser } from '~/handlers/users/user';
import { adminOnly } from '~/middleware/admin';
import { auth } from '~/middleware/auth';
import { Ctx } from '~/types/hono';
import jsonValidator from '~/utils/validator/jsonValidator';
import uploadValidator from '~/utils/validator/uploadValidator';

const app = new Hono();

app.use('*', setup);
app.use('*', writeAnalytics);

// User
app.get(
	'/api/users/@me',
	auth,
	getUser,
);

// Projects
app.get(
	'/api/projects',
	getProjects,
);
app.get(
	'/api/projects/:projectName',
	getProject,
);
app.patch(
	'/api/projects/:projectName',
	auth,
	jsonValidator(patchProjectSchema, patchProject),
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
app.patch(
	'/api/projects/:projectName/:releaseChannel',
	auth,
	jsonValidator(patchProjectReleaseChannelSchema, patchReleaseChannel),
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

// -- Auth --
// GitHub
app.get(
	'/api/auth/oauth/github/initiate',
	githubInitiate,
);
app.get(
	'/api/auth/oauth/github/callback',
	githubCallback,
);

// -- Admin --
app.use('/api/admin/*', auth, adminOnly);
// Migration
app.post(
	'/api/admin/migration/rewrite_build',
	uploadValidator(postRewriteBuild, rewriteBuildSchema),
);

app.onError((err, ctx) => errors.InternalError.withError(err).toResponse(ctx as unknown as Ctx));
app.notFound((ctx) => errors.RouteNotFound.toResponse(ctx as unknown as Ctx));

export default app;
