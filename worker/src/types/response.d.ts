// Entity responses
interface ProjectResponse {
	name: string;
  description: string;
  repoLink: string | null;
  wikiLink: string | null;
  defaultReleaseChannel: ReleaseChannelResponse;
}

interface ReleaseChannelResponse {
	name: string;
	supportedVersions: string;
	dependencies: string[];
}
