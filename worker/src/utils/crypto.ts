import { createHash } from 'node:crypto';
import type { Buffer } from 'node:buffer';

export function sha256(input: Buffer) {
	return createHash('sha256').update(input).digest('hex');
}
