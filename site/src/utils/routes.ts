import { route } from '~/utils/route';

export const Pages = Object.freeze({
	projectBuilds: route`/project/${'projectName'}`,
	projectReleaseChannelBuilds: route`/project/${'projectName'}/${'releaseChannel'}`,

	downloadLatestBuild: route`/dl/${'projectName'}/${'releaseChannel'}/latest`,
	downloadSpecificBuild: route`/dl/${'projectName'}/${'releaseChannel'}/${'version'}`,
});
