import { Hono } from 'hono';
import * as errors from '~/api/errors';
import {
	getProjectLatestBuild,
	getLatestBuildForReleaseChannel,
	postUploadBuild,
	getAllProjectBuilds,
	getProjectBuildVersion,
} from '~/handlers/builds/build';
import { getDownloadBuild } from '~/handlers/builds/download';
import {
	getProject,
	getProjects,
	newProjectSchema,
	postNewProject,
} from '~/handlers/projects/project';
import { setup } from '~/handlers/setup';
import { auth } from '~/middleware/auth';
import { Ctx } from '~/types/hono';
import jsonValidator from '~/utils/validator/jsonValidator';
import uploadValidator from '~/utils/validator/uploadValidator';

const app = new Hono();

app.use('*', setup);

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

// Builds
app.get(
	'/api/builds/:projectName',
	getAllProjectBuilds,
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
);

app.onError((err, ctx) => errors.InternalError.withError(err).toResponse(ctx as Ctx));
app.notFound((ctx) => errors.RouteNotFound.toResponse(ctx as Ctx));

export default app;
