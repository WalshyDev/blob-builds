interface GitInfo {
	commitHash?: string;
}

export function getGitInfo(): GitInfo {
	const commitHash = process.env.GITHUB_SHA;

	return { commitHash };
}
