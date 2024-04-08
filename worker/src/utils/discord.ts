import { Build, Project, User } from '~/store/schema';
import { Ctx } from '~/types/hono';
import { isDevTest } from '~/utils/utils';

export const randomMessages = [
	'Is it a bird?\nIs it a plane?\nNo, it\'s Build #<id> of <repo>',
	'Wow, that actually worked?\nI mean, of course, yes, sure.',
	'It\'sa me, Build #<id> of <repo>',
	'<repo> has been updated to Build #<id>',
	'<user> really outdid themselves!\nBuild #<id> of <repo> was a success!',
	'<repo> #<id> compiled successfully!\n<user> must be so proud!',
	'Oh cool another build of <repo>...',
	'Look!\nA new Build of <repo> just dropped from the sky!',
	'Did someone order a large <repo> with some extra <user> on top?',
	'Ding Dong!\nBuild #<id> of <repo> is here!',
	'Knock Knock!\nWho\'s there?\nBuild #<id>!\nBuild #<id> who?\n\nBuild #<id> of <repo>!',
	'Now entering... Build #<id> of <repo>',
	'A new challenger approached!\nBuild #<id> of <repo>',
	'A wild <repo> has appeared!',
	'Whooooooooooooosh\n\nA <repo> build flew by!',
	'Pssst...\nYou want some <repo>?\nHere\'s a fresh build!',
	'Build #<id> of <repo> has just graduated!\nIt is now ready for your servers!',
	'<user> just grew another <repo> Tree in his garden.\nLook! There is already a juicy build #<id> hanging beneath it!',
	'Another fresh oven-baked piece of <repo> is ready!\nBe careful not to burn yourself!',
	'Did someone say <repo>?\nNo?\nWell, here you go anyway...',
];

function projectUrl(project: string, releaseChannel: string) {
	return `https://blob.build/project/${project}/${releaseChannel}`;
}

export async function postBuildToDiscord(
	ctx: Ctx,
	user: User,
	project: Project,
	releaseChannel: ReleaseChannel,
	build: Build,
) {
	if (ctx.env.BUILDS_WEBHOOK === undefined) {
		console.log('No BUILDS_WEBHOOK set, skipping Discord notification');
		return;
	}
	if (isDevTest(ctx)) {
		console.log('Skipping Discord notification in dev/test');
		return;
	}

	let message = randomMessages[Math.floor(Math.random() * randomMessages.length)]
		.replaceAll('<id>', build.buildId.toString())
		.replaceAll('<repo>', project.name)
		.replaceAll('<user>', user.name);

	if (build.commitHash != null && project.repoLink != null) {
		message += `\n\nCommit: [\`${build.commitHash.substring(0, 7)}\`](${project.repoLink}/commit/${build.commitHash})`;
	}

	const fields: EmbedField[] = [];
	if (build.releaseNotes != null && build.releaseNotes.trim() !== '') {
		fields.push({
			name: 'Release Notes',
			value: build.releaseNotes.substring(0, 1000)
					+ (build.releaseNotes.length > 1000 ? '...' : ''),
		});
	}

	// Post the build to Discord
	const buildMessage = await fetch(`${ctx.env.BUILDS_WEBHOOK}?wait=true`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			embeds: [{
				title: `${project.name} ${releaseChannel.name} Build #${build.buildId}`,
				type: 'rich',
				url: projectUrl(project.name, releaseChannel.name),
				description: message,
				timestamp: new Date().toISOString(),
				color: 0x00ff00, // Green
				fields,
				footer: {
					text: user.name,
				},
			}] as DiscordEmbed[],
		}),
	});

	if (!buildMessage.ok) {
		console.error('Failed to post build to Discord', buildMessage.status, buildMessage.statusText);
		console.error(await buildMessage.text());
		return;
	}

	if (ctx.env.DISCORD_BOT_TOKEN === undefined) {
		console.log('No DISCORD_BOT_TOKEN set, skipping Discord notificatiton auto-publish');
		return;
	}
	const json = await buildMessage.json() as WebhookMessage;
	console.log(`Posted ${json.id} to #${json.channel_id}`);

	// Auto-publish the message
	await fetch(`https://discord.com/api/v10/channels/${json.channel_id}/messages/${json.id}/crosspost`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${ctx.env.DISCORD_BOT_TOKEN}`,
		},
	});
}
