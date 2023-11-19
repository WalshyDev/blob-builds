import type { PropsWithChildren } from 'react';

const baseStyles = 'font-bold text-slate-50 my-4';

export function H1({ children }: PropsWithChildren) {
	return <h1 className={`text-3xl ${baseStyles}`}>{children}</h1>;
}

export function H2({ children }: PropsWithChildren) {
	return <h1 className={`text-2xl ${baseStyles}`}>{children}</h1>;
}

export function H3({ children }: PropsWithChildren) {
	return <h1 className={`text-xl ${baseStyles}`}>{children}</h1>;
}

export function H4({ children }: PropsWithChildren) {
	return <h1 className={`text-l ${baseStyles}`}>{children}</h1>;
}

