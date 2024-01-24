import { SingleProjectListNew } from '~/store/ProjectStore';
import { Project, ReleaseChannel } from '~/store/schema';

export function toProjectResponse(
	proj: Project | SingleProjectListNew,
	releaseChannel?: ReleaseChannel,
): ProjectResponse {
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
		releaseChannels: proj.releaseChannels,
		defaultReleaseChannel: releaseChannelResponse,
	};
}
