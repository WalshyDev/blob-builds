// import crypto from 'node:crypto';
import type { Buffer } from 'node:buffer';

// TODO: Use when crypto is no longer experimental in workerd
// export function sha256(input: Buffer) {
// 	return crypto.createHash('sha256').update(input).digest('hex');
// }

export async function sha256(input: Buffer) {
	const hashBuffer = await crypto.subtle.digest('SHA-256', input);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
