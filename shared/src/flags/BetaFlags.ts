enum BetaFlags {
	PROJECT_DETAILS = 'project_details',
	PROJECT_ANALYTICS = 'project_analytics',
}

export function hasBeta(flags: string[], beta: BetaFlags): boolean {
	return flags.includes(beta);
}

export default BetaFlags;
