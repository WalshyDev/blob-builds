import { Buffer } from 'node:buffer';
import { createHash, randomBytes } from 'node:crypto';

export function sha256(input: Buffer) {
	return createHash('sha256').update(input).digest('hex');
}

export function randomHex(length: number) {
	return randomBytes(length / 2).toString('hex');
}

export function randomChars(length: number = 8) {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
