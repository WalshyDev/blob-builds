import { route } from '~/utils/route';

export const Pages = Object.freeze({
	downloadLatestBuild: route`/dl/${'projectName'}/${'releaseChannel'}/latest`,
	downloadSpecificBuild: route`/dl/${'projectName'}/${'releaseChannel'}/${'version'}`,
});
