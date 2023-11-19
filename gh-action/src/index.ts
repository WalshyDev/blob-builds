import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { getInput, setFailed } from '@actions/core';

async function main() {
	const project = getInput('project', { required: true });
	const releaseChannel = getInput('releaseChannel', { required: false });
	const apiToken = getInput('apiToken', { required: true });
	const filePath = getInput('file', { required: true });
	let releaseNotes = getInput('releaseNotes', { required: false });

	if (releaseNotes === '') {
		console.log('No release notes provided, skipping release notes upload');
	}
	if (releaseNotes.length < 30) {
		console.log('Release notes too short, skipping release notes upload');
		releaseNotes = '';
	}

	const file = await readFile(filePath);

	// Hash the file
	const sha256 = createHash('sha256').update(file).digest('hex');

	// Upload the file
	const formFile = new File([new Blob([file])], filePath, { type: 'application/java-archive' });

	const formData = new FormData();
	formData.append('file', formFile);
	formData.append('metadata', JSON.stringify({
		checksum: sha256,
		release_notes: releaseNotes === '' ? undefined : releaseNotes,
	}));

	const res = await fetch(`https://blob.build/api/projects/${project}/${releaseChannel}/upload`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		body: formData,
	});

	if (!res.ok) {
		setFailed(`Failed to upload file: ${res.status} ${res.statusText}`);
		throw new Error(await res.text());
	}

	const json = await res.json();
	console.log(json);
}

main();
