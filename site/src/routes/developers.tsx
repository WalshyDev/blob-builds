export default function Developers() {
	if (typeof window === 'undefined') return null;

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	window.location = '/docs';
}
