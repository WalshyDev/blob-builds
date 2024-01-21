import { Project, ReleaseChannel } from '~/store/schema';

export function toProjectResponse(proj: Project, releaseChannel?: ReleaseChannel): ProjectResponse {
	let releaseChannelResponse: ReleaseChannelResponse = null;
	if (releaseChannel !== undefined && releaseChannel !== null && typeof releaseChannel === 'object') {
		releaseChannelResponse = {
			name: releaseChannel.name,
			supportedVersions: releaseChannel.supportedVersions,
			dependencies: releaseChannel.dependencies,
		};
	}

	return {
		owner: proj.owner,
		name: proj.name,
		description: proj.description,
		repoLink: proj.repoLink,
		wikiLink: proj.wikiLink,
		defaultReleaseChannel: releaseChannelResponse,
	};
}
