import JSZip from 'jszip';
import { parse, stringify } from 'yaml';
import { ApiError } from '~/api/ApiError';
import * as errors from '~/api/errors';

// Overwrite the version in the plugin.yml or paper-plugin.yml with the new version.
export async function overwriteVersion(jarFile: ArrayBuffer, newVersion: string): Promise<ApiError | ArrayBuffer> {
	const jsZip = new JSZip();
	const zip = await jsZip.loadAsync(jarFile);

	const file = findFile(zip, ['plugin.yml', 'plugin.yaml', 'paper-plugin.yml', 'paper-plugin.yaml']);
	if (file === undefined) {
		return errors.InvalidUpload('plugin.yml or paper-plugin.yml not found');
	}

	const content = await file.async('string');
	const yaml = parse(content);
	if (yaml.version === undefined) {
		return errors.InvalidUpload('plugin yml does not contain a version');
	}

	// Update the version
	yaml.version = newVersion;

	// Write the new plugin.yml
	const newYaml = stringify(yaml);
	zip.file(file.name, newYaml);

	// Write the new jar
	jarFile = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
	return jarFile;
}

export function findFile(zip: JSZip, files: string[]): JSZip.JSZipObject | undefined {
	for (const fileName of files) {
		const file = zip.file(fileName);
		if (file === null) {
			continue; // File not found, skip it
		}
		return file;
	}

	// None of the files were found
	return undefined;
}
