enum UserFlags {
	ADMIN = 1 << 0,
}

export function hasUserFlag(flags: number, flag: UserFlags): boolean {
	return (flags & flag) === flag;
}

export default UserFlags;
