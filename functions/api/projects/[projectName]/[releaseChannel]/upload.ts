import { Buffer } from 'node:buffer';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { handleAuth } from '~/functions/middleware/auth';
import { insertNewBuild } from '~/functions/store/builds';
import { getProject } from '~/functions/store/projects';
import { getReleaseChannel } from '~/functions/store/releaseChannels';
import { ErrorCode, badRequest, ok } from '~/functions/utils/api';
import { sha256 } from '~/functions/utils/crypto';
import { parseJson } from '~/functions/utils/zod';
import Constants from '~/utils/constants';

const metadataSchema = z.object({
	checksum: z.string().length(64),
	release_notes: z.string().min(30).max(2000).optional(),
});

export const handleUpload: BlobFunction = async ({ request, env, params, data }) => {
	if (!request.headers.get('content-type')?.includes('multipart/form-data')) {
		return badRequest(ErrorCode.INVALID_TYPE, 'Body needs to be form data!');
	}

	const { projectName, releaseChannel } = params;

	const project = await getProject(env.DB, projectName as string, data.userId);
	if (project === null) {
		return badRequest(ErrorCode.PROJECT_NOT_FOUND, 'Project not found!');
	}
	const channel = await getReleaseChannel(env.DB, releaseChannel as string, project.project_id);
	if (channel === null) {
		return badRequest(ErrorCode.RELEASE_CHANNEL_NOT_FOUND, 'Release channel not found!');
	}

	const formData = await request.formData();
	const file = formData.get('file');
	const metadataEntry = formData.get('metadata');

	// Validation
	if (file === null) {
		return badRequest(ErrorCode.MISSING_FIELD, 'Missing "field" in form data!');
	}
	if (metadataEntry === null) {
		return badRequest(ErrorCode.MISSING_FIELD, 'Missing "metadata" in form data!');
	}

	if (!(file instanceof File)) {
		return badRequest(ErrorCode.INVALID_TYPE, 'The "file" entry needs to be a file!');
	}
	if (metadataEntry instanceof File || metadataEntry === null) {
		return badRequest(ErrorCode.INVALID_TYPE, 'The "metadata" entry needs to be a JSON blob string!');
	}

	// TODO: Support more file types in the future
	if (!file.name.endsWith('.jar')) {
		return badRequest(ErrorCode.MISSING_FIELD, 'The "file" entry needs to be a jar file!');
	}

	const parser = parseJson(metadataEntry, metadataSchema);
	if (!parser.success) {
		return badRequest(ErrorCode.INVALID_JSON, fromZodError(parser.error).message);
	}
	const metadata = parser.data;

	const fileHash = await sha256(Buffer.from(await file.arrayBuffer()));
	if (fileHash !== metadata.checksum) {
		return badRequest(ErrorCode.INVALID_CHECKSUM, 'Invalid checksum!');
	}

	// Upload to R2
	console.log(`Uploading: ${projectName}/${releaseChannel}/${fileHash}`);
	await env.R2.put(`${projectName}/${releaseChannel}/${fileHash}`, file.stream(), {
		httpMetadata: {
			// TODO: Support more file types in the future
			contentType: 'application/java-archive',
			cacheControl: Constants.ONE_YEAR_CACHE,
		},
		sha256: fileHash,
	});

	// Insert into DB
	await insertNewBuild(
		env.DB,
		{
			file_hash: fileHash,
			supported_versions: channel.supported_versions,
			dependencies: channel.dependencies,
			release_notes: metadata.release_notes ?? '',
		},
		project.project_id,
		channel.release_channel_id,
	);

	// Success!

	return ok('Build uploaded!');
};

export const onRequest = [handleAuth, handleUpload];
