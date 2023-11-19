interface Env {
	DB: D1Database;
	R2: R2Bucket;
}

type ParamKeys = 'projectName' | 'releaseChannel';

interface ApiData {
	[any: string]: unknown; // Need to do this to satisfy types for Data :(
	userId: number;
	user: User;
}

type BlobFunction = PagesFunction<Env, ParamKeys, ApiData>;

interface UploadMetadata {
	checksum?: string; // Required but user data
}
