export function randomInt(max?: number): number {
	return Math.floor(Math.random() * (max ?? 1_000_000));
}
