export function log(...args: unknown[]) {
	console.log(...args);
}

export function error(...args: unknown[]) {
	console.error(...args);
}

export function debug(...args: unknown[]) {
	if (process.env.VERBOSE === 'true') {
		console.log(...args);
	}
}
