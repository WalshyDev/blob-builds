import { downloadUrl } from '~/handlers/builds/build';
import { Build, Project, User } from '~/store/schema';
import { Ctx } from '~/types/hono';

const messages = [
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
	'Build <id> of <repo> has just graduated!\nIt is now ready for your servers!',
	'<user> just grew another <repo> Tree in his garden.\nLook! There is already a juicy build #<id> hanging beneath it!',
	'Another fresh oven-baked piece of <repo> is ready!\nBe careful not to burn yourself!',
	'Did someone say <repo>?\nNo?\nWell, here you go anyway...',
];

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

	const message = messages[Math.floor(Math.random() * messages.length)]
		.replace('<id>', build.buildId.toString())
		.replace('<repo>', project.name)
		.replace('<user>', user.name);

	return fetch(ctx.env.BUILDS_WEBHOOK, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			embeds: [{
				title: `${project.name} Build #${build.buildId}`,
				type: 'rich',
				url: downloadUrl(project.name, releaseChannel.name, build.buildId.toString()),
				description: message,
				timestamp: new Date().toISOString(),
				author: {
					name: user.name,
				},
			}] as DiscordEmbed[],
		}),
	});
}
