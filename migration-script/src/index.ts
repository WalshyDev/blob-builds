import { argv, env } from 'node:process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { downloadJar, grabBuilds, newBuild, rewriteBuild, rewriteJar } from './blobBuilds';
import { log, debug } from './logger';
import { loadBuilds, downloadJarFromOld } from './oldBuildsParser';

const args = yargs(hideBin(argv))
	.option('old-path', { type: 'string', demandOption: true, requiresArg: true })
	.option('owner', { type: 'string', demandOption: true, requiresArg: true })
	.option('project', { type: 'string', demandOption: true, requiresArg: true })
	.option('release-channel', { type: 'string', demandOption: true, requiresArg: true })
	.option('skip-rewrite', { type: 'boolean', default: false })
	.option('verbose', { type: 'boolean', default: false })
	.parse();

async function main() {
	const { oldPath, owner, project, releaseChannel, skipRewrite, verbose } = await args;

	if (env.BLOB_ADMIN_TOKEN === undefined) {
		console.error('Please set the BLOB_ADMIN_TOKEN environment variable');
		process.exit(1);
	}

	if (verbose) {
		env.VERBOSE = 'true';
	}

	log(`Migrating ${oldPath} to ${owner}/${project} on ${releaseChannel}`);

	// Get all the builds in blob builds
	log('Loading builds from blob builds...');
	const builds = await grabBuilds(project, releaseChannel);
	log(`Found ${builds.length} blob builds`);
	debug(builds);

	// Get all the old builds
	log('Loading old builds...');
	const oldBuilds = await loadBuilds(oldPath);
	log(`Found ${oldBuilds.length} old builds`);
	debug(oldBuilds);

	const latestBuild = oldBuilds[oldBuilds.length - 1];

	// Rewrite the newer builds
	if (!skipRewrite) {
		log(`Rewriting ${builds.length} builds`);
		for (const build of builds) {
			// We're continuing from the old system
			// So if we had build 100 there and 4 builds here, we'd want to insert 104
			const newBuildId = latestBuild.id + build.buildId;

			log(`  Rewriting ${build.buildId} -> ${newBuildId} (continuing from ${latestBuild.id})`);

			const file = await downloadJar(project, releaseChannel, build.buildId);

			// rewrite file
			const { jarFile, fileHash } = await rewriteJar(file, releaseChannel, newBuildId);

			await rewriteBuild(project, releaseChannel, build.buildId, newBuildId, new Blob([jarFile]), fileHash);
		}
	}

	// Move the builds to the new build system
	for (const build of oldBuilds) {
		log(`Migrating build ${build.id}...`);

		if (builds.find((b) => b.buildId === build.id) !== undefined) {
			log(`  Skipping build ${build.id} because it already exists`);
			continue;
		}

		if (build.status !== 'SUCCESS') {
			// TODO: Figure out what to do with failed builds
			log(`  Skipping build ${build.id} because it is not successful`);
			continue;
		}

		// Download the old jar
		const file = await downloadJarFromOld(oldPath, build);
		if (file === null) continue;

		// Rewrite the jar with the new version key
		const { jarFile, fileHash } = await rewriteJar(file, releaseChannel, build.id);

		// TODO: Can I parse supported versions and dependencies nicely?

		// Upload the new jar to the same build id
		await newBuild(
			project,
			releaseChannel,
			build.id,
			new Blob([jarFile]),
			fileHash,
			build.changelog,
		);
	}
}

main();
