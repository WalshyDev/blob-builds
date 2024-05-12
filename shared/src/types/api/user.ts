import { OAuthProvider } from '~/types/api/oauth';

export interface UserResponse {
	name: string;
	oauthProvider: OAuthProvider | null;
	oauthId: string | null;
	apiToken: string;
	flags: number;
	betaFlags: string[];
}
