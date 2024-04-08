import { MockInterceptor } from 'cloudflare:test';
import { applyD1Migrations, env, fetchMock } from 'cloudflare:test';
import { createUser, createProject, createBuild, createJarFile, init } from 'tests/testutils/seed';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import ReleaseChannelStore from '~/store/ReleaseChannelStore';
import { Build, Project, User } from '~/store/schema';
import { postBuildToDiscord, randomMessages } from '~/utils/discord';

describe('Discord sending', () => {
	beforeEach(async () => {
		await applyD1Migrations(env.DB, env.MIGRATIONS);

		// Intercept fetch
		fetchMock.activate();
		fetchMock.disableNetConnect();

		// Override env
		env.ENVIRONMENT = 'production';
		env.BUILDS_WEBHOOK = 'https://discord.local/webhook/channel/token';
		delete env.DISCORD_BOT_TOKEN;
	});

	afterEach(() => {
		fetchMock.assertNoPendingInterceptors();
		vi.restoreAllMocks();
	});

	test('Will not send if BUILD_WEBHOOKS is not set', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user);
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar);

		delete env.BUILDS_WEBHOOK;
		const ctx = { env };

		// Will fail if fetch is sent as we're not intercepting

		// Call the function
		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, project.defaultReleaseChannel, build);
	});

	test('Will not send if in dev or test', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user);
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar);

		const ctx = { env };

		// Will fail if fetch is sent as we're not intercepting

		// Test with dev
		env.ENVIRONMENT = 'dev';
		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, project.defaultReleaseChannel, build);

		// Test with test
		env.ENVIRONMENT = 'test';
		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, project.defaultReleaseChannel, build);
	});

	test('Will send basic message to Discord', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user);
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar);

		const ctx = { env };

		const channelId = 10_000;
		const messageId = 12_345;

		// @ts-expect-error - Is defined in intercept
		let msg: WebhookMessage = {};
		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			(body) => msg = body,
			201,
			{
				id: messageId,
				channel_id: channelId,
			},
		);

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate msg
		expect(msg).toBeDefined();
		expect(msg.embeds.length).toBe(1);

		const embed = msg.embeds[0];
		expect(embed.title).toBe(`${project.name} ${rc?.name} Build #${build.buildId}`);
		expect(embed.type).toBe('rich');
		expect(embed.url).toBe(`https://blob.build/project/${project.name}/${rc?.name}`);
		expect(randomMessages).toContain(msgToPlaceholderMsg(embed.description!, user, project, build));
		expect(embed.fields?.length).toBe(0);
		expect(embed.footer?.text).toBe(user.name);
	});

	test('Will send message with commit hash', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user, { repoLink: 'https://github.com/WalshyDev/blob-builds' });
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar, { commitHash: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd' });

		const ctx = { env };

		const channelId = 10_000;
		const messageId = 12_345;

		// @ts-expect-error - Is defined in intercept
		let msg: WebhookMessage = {};
		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			(body) => msg = body,
			201,
			{
				id: messageId,
				channel_id: channelId,
			},
		);

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate msg
		expect(msg).toBeDefined();
		expect(msg.embeds.length).toBe(1);

		const embed = msg.embeds[0];
		const randMsg = embed.description!.substring(0, embed.description!.indexOf('\n\nCommit:'));
		const commitLink = `[\`${build.commitHash?.substring(0, 7)}\`](${project.repoLink}/commit/${build.commitHash})`;

		expect(embed.title).toBe(`${project.name} ${rc?.name} Build #${build.buildId}`);
		expect(embed.type).toBe('rich');
		expect(embed.url).toBe(`https://blob.build/project/${project.name}/${rc?.name}`);
		expect(randomMessages).toContain(msgToPlaceholderMsg(randMsg, user, project, build));
		expect(embed.description).contain(`Commit: ${commitLink}`);
		expect(embed.fields?.length).toBe(0);
		expect(embed.footer?.text).toBe(user.name);
	});

	test('Will send message with release notes', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user, { repoLink: 'https://github.com/WalshyDev/blob-builds' });
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar, {
			releaseNotes: '# Release v1.0\n* Added feature one\n* Added feature two',
		});

		const ctx = { env };

		const channelId = 10_000;
		const messageId = 12_345;

		// @ts-expect-error - Is defined in intercept
		let msg: WebhookMessage = {};
		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			(body) => msg = body,
			201,
			{
				id: messageId,
				channel_id: channelId,
			},
		);

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate msg
		expect(msg).toBeDefined();
		expect(msg.embeds.length).toBe(1);

		const embed = msg.embeds[0];

		expect(embed.title).toBe(`${project.name} ${rc?.name} Build #${build.buildId}`);
		expect(embed.type).toBe('rich');
		expect(embed.url).toBe(`https://blob.build/project/${project.name}/${rc?.name}`);
		expect(randomMessages).toContain(msgToPlaceholderMsg(embed.description!, user, project, build));
		expect(embed.fields?.length).toBe(1);

		const releaseNoteField = embed.fields![0];
		expect(releaseNoteField.name).toBe('Release Notes');
		expect(releaseNoteField.value).toBe('# Release v1.0\n* Added feature one\n* Added feature two');

		expect(embed.footer?.text).toBe(user.name);
	});

	test('Release notes will be truncated', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user, { repoLink: 'https://github.com/WalshyDev/blob-builds' });
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar, {
			releaseNotes: 'a'.repeat(2000),
		});

		const ctx = { env };

		const channelId = 10_000;
		const messageId = 12_345;

		// @ts-expect-error - Is defined in intercept
		let msg: WebhookMessage = {};
		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			(body) => msg = body,
			201,
			{
				id: messageId,
				channel_id: channelId,
			},
		);

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate msg
		expect(msg).toBeDefined();
		expect(msg.embeds.length).toBe(1);

		const embed = msg.embeds[0];

		expect(embed.title).toBe(`${project.name} ${rc?.name} Build #${build.buildId}`);
		expect(embed.type).toBe('rich');
		expect(embed.url).toBe(`https://blob.build/project/${project.name}/${rc?.name}`);
		expect(randomMessages).toContain(msgToPlaceholderMsg(embed.description!, user, project, build));
		expect(embed.fields?.length).toBe(1);

		const releaseNoteField = embed.fields![0];
		expect(releaseNoteField.name).toBe('Release Notes');
		expect(releaseNoteField.value).toBe('a'.repeat(1000) + '...');

		expect(embed.footer?.text).toBe(user.name);
	});

	test('Messages can be auto-published', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user, { repoLink: 'https://github.com/WalshyDev/blob-builds' });
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar, { commitHash: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd' });

		env.DISCORD_BOT_TOKEN = 'bot-token';

		const ctx = { env };

		const channelId = 10_000;
		const messageId = 12_345;

		// @ts-expect-error - Is defined in intercept
		let msg: WebhookMessage = {};
		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			(body) => msg = body,
			201,
			{
				id: messageId,
				channel_id: channelId,
			},
		);

		// Ensure our message gets auto-published
		fetchMock.get('https://discord.com')
			.intercept({ method: 'POST', path: `/api/v10/channels/${channelId}/messages/${messageId}/crosspost` })
			.reply(200, { ok: true });

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate msg
		expect(msg).toBeDefined();
		expect(msg.embeds.length).toBe(1);

		const embed = msg.embeds[0];
		const randMsg = embed.description!.substring(0, embed.description!.indexOf('\n\nCommit:'));
		const commitLink = `[\`${build.commitHash?.substring(0, 7)}\`](${project.repoLink}/commit/${build.commitHash})`;

		expect(embed.title).toBe(`${project.name} ${rc?.name} Build #${build.buildId}`);
		expect(embed.type).toBe('rich');
		expect(embed.url).toBe(`https://blob.build/project/${project.name}/${rc?.name}`);
		expect(randomMessages).toContain(msgToPlaceholderMsg(randMsg, user, project, build));
		expect(embed.description).contain(`Commit: ${commitLink}`);
		expect(embed.fields?.length).toBe(0);
		expect(embed.footer?.text).toBe(user.name);
	});

	test('Will log if send fails', async () => {
		const user = await createUser(env);
		const project = await createProject(env, user, { repoLink: 'https://github.com/WalshyDev/blob-builds' });
		const rc = await init(env, () => ReleaseChannelStore.getReleaseChannelById(project.defaultReleaseChannel!));
		const jar = await createJarFile();
		const build = await createBuild(env, project, jar, { commitHash: 'abcdefabcdefabcdefabcdefabcdefabcdefabcd' });

		env.DISCORD_BOT_TOKEN = 'bot-token';

		const ctx = { env };

		intercept<WebhookMessage>(
			'https://discord.local',
			{ method: 'POST', path: '/webhook/channel/token', query: { wait: 'true' } },
			() => {},
			400,
			{
				error: 'Failed to send due to some test thing',
			},
		);

		const consoleMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		// @ts-expect-error - We don't need hono's full ctx
		await postBuildToDiscord(ctx, user, project, rc, build);

		// Validate error was returned
		expect(consoleMock).toBeCalledTimes(2);
		expect(consoleMock).toBeCalledWith('Failed to post build to Discord', 400, 'Bad Request');
		expect(consoleMock).toBeCalledWith('{"error":"Failed to send due to some test thing"}');

		consoleMock.mockReset();
	});
});

function intercept<T = object>(
	origin: string,
	opts: MockInterceptor.Options,
	requestBodyCallback: (body: T) => void,
	status: number,
	response: object,
) {
	const builtQuery = opts.query === undefined
		? ''
		: `${Object.entries(opts.query).map(([key, val]) => `${key}=${val}`).join('&')}`;

	// @ts-expect-error - response type weirdness
	vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (input, init) => {
		const request = new Request(input, init);
		const url = new URL(request.url);

		if (
			request.method === (opts.method ?? 'GET')
			&& url.origin === origin
			&& url.pathname === (opts.path ?? '/')
			&& url.searchParams.toString() === (builtQuery)
		) {
			const requestBody = await request.clone().json<T>();
			requestBodyCallback(requestBody);

			return new Response(JSON.stringify(response), { status, headers: { 'Content-Type': 'application/json' } });
		}

		throw new Error('No mock found');
	});
}

function msgToPlaceholderMsg(msg: string, user: User, project: Project, build: Build) {
	return msg
		.replaceAll(`#${build.buildId}`, '#<id>')
		.replaceAll(project.name, '<repo>')
		.replaceAll(user.name, '<user>');
}
