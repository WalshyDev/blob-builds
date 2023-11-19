import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getInput, setFailed } from '@actions/core';

async function main() {
	const project = getInput('project', { required: true });
	const releaseChannel = getInput('releaseChannel', { required: false });
	const apiToken = getInput('apiToken', { required: true });
	const filePath = getInput('file', { required: true });
	const releaseNotes = getInput('releaseNotes', { required: false });

	const file = await readFile(filePath);

	// Hash the file
	const sha256 = createHash('sha256').update(file).digest('hex');

	// Upload the file
	const formData = new FormData();
	formData.append('file', new Blob([file]));
	formData.append('metadata', JSON.stringify({ checksum: sha256, release_notes: releaseNotes }));

	const res = await fetch(`https://blob.build/api/projects/${project}/${releaseChannel}/upload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		body: formData,
	});

	if (!res.ok) {
		setFailed(`Failed to upload file: ${res.status} ${res.statusText}`);
		throw new Error(await res.json());
	}

	const json = await res.json();
	console.log(json);
}

main();
