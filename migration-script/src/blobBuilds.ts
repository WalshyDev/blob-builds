import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { parse, stringify } from 'yaml';

// const BLOB_BUILDS = 'https://blob.build';
const BLOB_BUILDS = 'http://localhost:8787';

export async function grabBuilds(project: string, releaseChannel: string): Promise<BlobBuild[]> {
	const res = await fetch(`${BLOB_BUILDS}/api/builds/${project}`);
	if (!res.ok) throw new Error(`Failed to grab builds: ${res.statusText}`);

	const json = await res.json() as BlobBuilds;
	if (!json.success || !json.data) throw new Error(`Failed to grab builds: ${json.error}`);

	return json.data[releaseChannel];
}

// Code taken from the upload handler
export async function rewriteJar(
	file: ArrayBuffer,
	releaseChannel: string,
	buildId: number,
): Promise<{ jarFile: ArrayBuffer, fileHash: string }> {
	const jsZip = new JSZip();
	const zip = await jsZip.loadAsync(file);

	let pluginYml = zip.file('plugin.yml');
	if (pluginYml === null) {
		// Try .yaml
		pluginYml = zip.file('plugin.yaml');
		if (pluginYml === null) {
			throw new Error('plugin.yml not found');
		}
	}
	const content = await pluginYml.async('string');
	const yaml = parse(content);
	if (yaml.version === undefined) {
		throw new Error('plugin.yml does not contain a version');
	}

	// Update the version
	yaml.version = `${releaseChannel} - ${buildId}`;

	// Write the new plugin.yml
	const newYaml = stringify(yaml);
	zip.file('plugin.yml', newYaml);

	// Write the new jar
	const jarFile = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
	const fileHash = createHash('sha256').update(jarFile).digest('hex');

	return { jarFile, fileHash };
}

export async function rewriteBuild(
	projectName: string,
	releaseChannel: string,
	buildId: number,
	newBuildId: number,
	newJar: Blob,
	checksum: string,
) {
	const formData = new FormData();
	formData.set('file', newJar, `${projectName}-${buildId}.jar`);
	formData.set('metadata', JSON.stringify({
		projectName,
		releaseChannel,
		buildId,

		newBuildId,
		checksum,
	}));

	const res = await fetch(`${BLOB_BUILDS}/api/admin/migration/rewrite_build`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.BLOB_ADMIN_TOKEN}`,
		},
		body: formData,
	});

	if (!res.ok) {
		console.error(await res.json());
		throw new Error(`Failed to rewrite build: ${buildId} to ${newBuildId}`);
	}
}

export async function newBuild(
	projectName: string,
	releaseChannel: string,
	buildId: number,
	newJar: Blob,
	checksum: string,
	releaseNotes?: string,
	supportedVersions?: string,
	dependencies?: string[],
) {
	const formData = new FormData();
	formData.set('file', newJar, `${projectName}-${buildId}.jar`);
	formData.set('metadata', JSON.stringify({
		projectName,
		releaseChannel,

		newBuildId: buildId,
		checksum,
		releaseNotes,
		supportedVersions,
		dependencies,
	}));

	const res = await fetch(`${BLOB_BUILDS}/api/admin/migration/rewrite_build`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.BLOB_ADMIN_TOKEN}`,
		},
		body: formData,
	});

	if (!res.ok) {
		console.error(await res.json());
		throw new Error(`Failed to upload build: ${buildId}`);
	}
}

export async function downloadJar(projectName: string, releaseChannel: string, buildId: number) {
	const jarRes = await fetch(`${BLOB_BUILDS}/dl/${projectName}/${releaseChannel}/${buildId}`);
	if (!jarRes.ok) throw new Error(`Failed to download jar: ${jarRes.statusText}`);

	return jarRes.arrayBuffer();
}
