import { route } from '~/utils/route';

export const Pages = Object.freeze({
	downloadLatestBuild: route`/builds/${'projectName'}/${'releaseChannel'}/latest`,
});
