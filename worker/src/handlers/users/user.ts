import { success } from '~/api/api';
import { User } from '~/store/schema';
import { Ctx } from '~/types/hono';

// GET /api/users/@me
export async function getUser(ctx: Ctx) {
	return success('Success', toUserResponse(ctx.get('user')));
}

export interface UserResponse {
	name: string;
	apiToken: string;
}

export function toUserResponse(user: User): UserResponse {
	return {
		name: user.name,
		apiToken: user.apiToken,
	};
}
