import { createHash } from 'node:crypto';
import { drizzle } from 'drizzle-orm/d1';
import JSZip from 'jszip';
import { randomChars } from 'tests/testutils/rand';
import { Toucan } from 'toucan-js';
import { Analytics } from '~/analytics/analytics';
import BuildStore from '~/store/BuildStore';
import ProjectSettingStore from '~/store/ProjectSettingStore';
import ProjectStore from '~/store/ProjectStore';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { InsertBuild, InsertProject, InsertReleaseChannel, InsertUser, Project, User } from '~/store/schema';
import * as schema from '~/store/schema';
import UserStore from '~/store/UserStore';
import { Env } from '~/types/hono';
import { Store, storage } from '~/utils/storage';

const DEBUG_SETUP = false;

export async function init<T>(env: Env, func: () => T): Promise<T> {
	const analytics = new Analytics();
	const db = drizzle(env.DB, { schema, logger: DEBUG_SETUP });
	const store: Store = { env, analytics, sentry: new Toucan({}), db };

	return storage.run(store, async () => await func());
}

export async function createUser(env: Env, userOpts?: Partial<InsertUser>): Promise<User> {
	const user: InsertUser = {
		userId: userOpts?.userId,
		name: userOpts?.name ?? 'test-user-' + randomChars(),
		apiToken: userOpts?.apiToken ?? randomChars(64),
	};

	return init(env, async () => await UserStore.insertNewUser(user));
}

export interface Authn {
	apiToken: string;
}

export async function createAuth(user: User): Promise<Authn> {
	return {
		apiToken: user.apiToken,
	};
}

export async function createProject(
	env: Env,
	user: User,
	projOpts?: Partial<InsertProject>,
	rcOpts?: Partial<InsertReleaseChannel>,
): Promise<Project> {
	// Create configured project
	const proj: InsertProject = {
		projectId: projOpts?.projectId,
		userId: projOpts?.userId ?? user.userId,
		name: projOpts?.name ?? 'test-project-' + randomChars(),
		description: projOpts?.description ?? 'Test project',
		repoLink: projOpts?.repoLink,
		wikiLink: projOpts?.wikiLink,
		defaultReleaseChannel: projOpts?.defaultReleaseChannel,
	};

	// Create default releae channel
	const rc: InsertReleaseChannel = {
		releaseChannelId: rcOpts?.releaseChannelId,
		projectId: projOpts?.projectId ?? -1,
		name: rcOpts?.name ?? 'Dev',
		supportedVersions: rcOpts?.supportedVersions ?? 'Unknown',
		dependencies: rcOpts?.dependencies ?? [],
		fileNaming: rcOpts?.fileNaming ?? '$project.jar',
	};

	return init(env, async () => {
		const createdProject = await ProjectStore.insertNewProject(proj);
		await ProjectSettingStore.newProject(createdProject.projectId);

		// Set the rc to the default rc
		if (projOpts?.projectId === undefined) {
			rc.projectId = createdProject.projectId;
		}

		const createdRc = await ReleaseChannelStore.insertNewReleaseChannel(rc);

		// Update the default RC
		await ProjectStore.updateProject(createdProject.projectId, {
			defaultReleaseChannel: createdRc[0].releaseChannelId,
		});
		createdProject.defaultReleaseChannel = createdRc[0].releaseChannelId;

		return createdProject;
	});
}

export async function createReleaseChannel(env: Env, project: Project, opts?: Partial<InsertReleaseChannel>) {
	const rc: InsertReleaseChannel = {
		releaseChannelId: opts?.releaseChannelId,
		projectId: opts?.projectId ?? project.projectId,
		name: opts?.name ?? 'Dev',
		supportedVersions: opts?.supportedVersions ?? 'Unknown',
		dependencies: opts?.dependencies ?? [],
		fileNaming: opts?.fileNaming ?? '$project.jar',
	};

	// This returns an array, it's a bit dumb so just grab the first value
	return init(env, async () => (await ReleaseChannelStore.insertNewReleaseChannel(rc))[0]);
}

export async function createBuild(env: Env, project: Project, jar: SeededJar, buildOpts?: Partial<InsertBuild>) {
	const releaseChannelId = buildOpts?.releaseChannelId ?? project.defaultReleaseChannel ?? -1;
	const lastBuildId = await init(env, async () => await BuildStore.getLastBuildId(project.projectId, releaseChannelId));

	const build: InsertBuild = {
		projectId: buildOpts?.projectId ?? project.projectId,
		releaseChannelId: buildOpts?.releaseChannelId ?? project.defaultReleaseChannel ?? -1,
		supportedVersions: buildOpts?.supportedVersions ?? 'Unknown',
		dependencies: buildOpts?.dependencies ?? [],
		buildId: buildOpts?.buildId ?? (lastBuildId?.buildId ?? 0) + 1,
		fileHash: buildOpts?.fileHash ?? jar.hash,
		releaseNotes: buildOpts?.releaseNotes ?? '',
		commitHash: buildOpts?.commitHash,
	};

	return init(env, async () => await BuildStore.insertNewBuild(build));
}

export interface SeededJarOptions {
	pluginYml?: string | null;
	mainFile?: string | null;
}

export interface SeededJar {
	bytes: ArrayBuffer;
	blob: Blob;
	hash: string;
	name: string;
}

export async function createJarFile(opts?: SeededJarOptions): Promise<SeededJar> {
	// @ts-expect-error - we're in a Worker and jszip is using it for whatever reason
	globalThis.setImmediate = (func: unknown) => setTimeout(func, 0);

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
	const name = 'test.jar';

	return createSeededJar(bytes, name);
}

export function createSeededJar(bytes: ArrayBuffer, name: string): SeededJar {
	const blob = new Blob([bytes], { type: 'application/java-archive' });
	const hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');

	return {
		bytes,
		blob,
		hash,
		name,
	};
}
