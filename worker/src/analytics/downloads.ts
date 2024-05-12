import { Env } from '~/types/hono';

// Make sure to add to #write
export interface Data {
	// Blobs
	project: string;        // blob1
	releaseChannel: string;	// blob2

	// Doubles
	version: never;         // double1 - configured below
	build: number;          // double2
}

const VERSION = 1;

export class DownloadAnalytics {

	private data: Partial<Data>;

	constructor() {
		this.data = {};
	}

	public set(data: Partial<Data>) {
		this.data = {
			...this.data,
			...data,
		};
	}

	public write(env: Env) {
		// AE is not supported in tests so ignore it for coverage
		/* istanbul ignore if -- @preserve */
		if (!env.DOWNLOAD_ANALYTICS) {
			console.log('DOWNLOAD_ANALYTICS not configured, attempted to write:', this.data);
			return;
		}

		console.log('Writing download analytics', this.data);
		/* istanbul ignore next -- @preserve */
		env.DOWNLOAD_ANALYTICS.writeDataPoint({
			indexes: [this.data.project ?? null],
			blobs: [
				this.data.project ?? null,        // blob1
				this.data.releaseChannel ?? null, // blob2
			],
			doubles: [
				VERSION,                          // double1
				this.data.build ?? -1,            // double2
			],
		});
	}
}
