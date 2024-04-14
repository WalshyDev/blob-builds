const Constants = Object.freeze({
	DOMAIN: 'https://blob.build',
	USER_AGENT: 'Mozilla/5.0 BlobBuilds (https://blob.build)',

	ONE_YEAR_CACHE: 'public, max-age=31536000, immutable',

	SESSION_DURATION: 1000 * 60 * 60 * 24 * 30, // 30 days
	STATE_DURATION: 1000 * 60 * 10, // 10 minutes
});

export default Constants;
