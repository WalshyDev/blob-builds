import { createHash } from 'node:crypto';
import path from 'node:path';
import JSZip from 'jszip';
import { randomInt } from 'tests/testutils/rand';
import { expect } from 'vitest';
import { UnstableDevWorker, unstable_dev } from 'wrangler';
import { DbQueryBody } from '~/handlers/test/db';
import { InsertProject, InsertReleaseChannel, InsertUser, Project, ReleaseChannel, User } from '~/store/schema';

export async function setupWorker() {
	return unstable_dev('src/index.ts', {
		// Most things will load from the wrangler.toml
		env: 'dev',
		vars: {
			ENVIRONMENT: 'test',
		},
		persist: true,
		persistTo: path.resolve('.wrangler/state/unit-test'),

		updateCheck: false,
		experimental: {
			disableExperimentalWarning: true,
			disableDevRegistry: true,
			forceLocal: true,
			testMode: true,
		},
	});
}

export async function populateDb<T = unknown>(worker: UnstableDevWorker, body: DbQueryBody) {
	const res = await worker.fetch('https://example.com/__test/db', {
		method: 'POST',
		body: JSON.stringify(body),
	});

	const json = await res.json() as ApiResponse<T>;

	if (json.success === true) {
		return json.data;
	} else {
		console.log(body);
		console.log(json);
		expect(json.error).toBeUndefined();
		expect(json.success).toBe(true);
	}
}

export async function createMockUser(worker: UnstableDevWorker, user?: Partial<InsertUser>) {
	const randId = randomInt();
	const userToCreate: InsertUser = {
		userId: user?.userId ?? randId,
		name: user?.name ?? `test-user-${randId}`,
		apiToken: user?.apiToken ?? `mock-api-token-${randId}`,
	};

	return populateDb<User>(worker, {
		whatDo: 'newUser',
		user: userToCreate,
	});
}

export async function createMockProject(
	worker: UnstableDevWorker,
	user: User,
	project?: Partial<InsertProject>,
	releaseChannels?: Partial<InsertReleaseChannel>[],
) {
	const randId = randomInt();
	const projectToCreate: InsertProject = {
		projectId: project?.projectId ?? randId,
		userId: project?.userId ?? user.userId,
		name: project?.name ?? `test-project-${randId}`,
		description: project?.description ?? 'test project',
		repoLink: project?.repoLink ?? null,
	};

	const createdProject = await populateDb<Project>(worker, {
		whatDo: 'newProject',
		project: projectToCreate,
	});

	if (releaseChannels === undefined) {
		releaseChannels = [{
			name: 'Dev',
			projectId: createdProject.projectId,
			supportedVersions: '1.0',
			dependencies: [],
			fileNaming: '$project.jar',
		}];
	}

	const createdReleaseChannels: ReleaseChannel[] = [];
	for (const releaseChannel of releaseChannels) {
		const rcToCreate: InsertReleaseChannel = {
			releaseChannelId: releaseChannel?.releaseChannelId ?? randomInt(),
			name: releaseChannel?.name ?? 'dev',
			projectId: createdProject?.projectId,
			supportedVersions: releaseChannel?.supportedVersions ?? '1.0',
			dependencies: releaseChannel?.dependencies ?? [],
			fileNaming: releaseChannel?.fileNaming ?? '$project.jar',
		};

		const created = await populateDb<ReleaseChannel>(worker, {
			whatDo: 'newReleaseChannel',
			releaseChannel: rcToCreate,
		});

		createdReleaseChannels.push(created);
	}

	return {
		project: createdProject,
		releaseChannels: createdReleaseChannels,
	};
}

export interface MockJarOptions {
	pluginYml?: string | null;
	mainFile?: string | null;
}

interface MockJar {
	bytes: ArrayBuffer;
	blob: Blob;
	hash: string;
}

export async function createMockJarFile(opts?: MockJarOptions): Promise<MockJar> {
	const zip = new JSZip();
	const fixedDate = new Date('2023-01-01');
	// Create a plugin.yml and main file so that can make this "real"
	// and so that we can read the plugin.yml on upload
	// Note: The date is fixed so that the checksum is always the same
	if (opts?.pluginYml === undefined) {
		zip.file('plugin.yml', 'name: test-plugin\nversion: 1.0\nmain: TestPlugin.java', { date: fixedDate });
	} else if (opts?.pluginYml !== null) {
		zip.file('plugin.yml', opts.pluginYml, { date: fixedDate });
	}
	if (opts?.mainFile === undefined) {
		zip.file('TestPlugin.java', 'public class TestPlugin extends JavaPlugin {}', { date: fixedDate });
	} else if (opts?.mainFile !== null) {
		zip.file('TestPlugin.java', opts.mainFile, { date: fixedDate });
	}

	const bytes = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
	const blob = new Blob([bytes], { type: 'application/java-archive' });
	const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');

	return {
		bytes,
		blob,
		hash,
	};
}
