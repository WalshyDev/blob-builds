// Entity responses
interface ProjectResponse {
	owner: string;
	name: string;
  description: string;
  repoLink: string | null;
  wikiLink: string | null;
	releaseChannels: string[];
  defaultReleaseChannel: ReleaseChannelResponse;
}

interface ReleaseChannelResponse {
	name: string;
	supportedVersions: string;
	dependencies: string[];
}
