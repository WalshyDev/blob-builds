import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { setFailed } from '@actions/core';
import { XMLParser } from 'fast-xml-parser';

export async function getFileFromPomXml() {
	const pom = await readFile('pom.xml', { encoding: 'utf-8' });
	const parser = new XMLParser();
	const parsedPom = parser.parse(pom);

	if (parsedPom?.project?.build?.finalName === undefined) {
		setFailed('<finalName> does not exist in pom.xml, therefor we can not grap the final file name!');
	}

	// Evaluate the final name, this will probably have variables therefore we cannot simply grab from the file.
	const output = execSync(
		'mvn help:evaluate -Dexpression=project.build.finalName -q -DforceStdout',
		{ encoding: 'utf-8' },
	);

	const path = `target/${output}.jar`;

	if (!existsSync(path)) {
		setFailed(`${path} does not exist!`);
	}

	return {
		file: await readFile(path),
		fileName: `${output}.jar`,
	};
}
