import { Env } from '~/types/hono';

// Make sure to add to #write
export interface Data {
	// Blobs
	url: string;            // blob1
	path: string;           // blob2
	method: string;         // blob3
	project: string;        // blob4
	releaseChannel: string; // blob5
	userAgent: string;      // blob6

	// Doubles
	version: never;         // double1 - configured below
	statusCode: number;     // double2
	responseTime: number;   // double3
}

const VERSION = 1;

export class Analytics {

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
		if (!env.AE) {
			console.log('AE not configured, attempted to write:', this.data);
			return;
		}

		/* istanbul ignore next -- @preserve */
		env.AE.writeDataPoint({
			indexes: [], // TODO: Auth
			blobs: [
				this.data.url,            // blob1
				this.data.path,           // blob2
				this.data.method,         // blob3
				this.data.project,        // blob4
				this.data.releaseChannel, // blob5
				this.data.userAgent,      // blob6
			],
			doubles: [
				VERSION,                // double1
				this.data.statusCode,   // double2
				this.data.responseTime, // double3
			],
		});
	}
}
