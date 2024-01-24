import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

type H1Props = PropsWithChildren & React.HTMLAttributes<HTMLHeadingElement>;

export function H1({ children, ...props }: H1Props) {
	return <h1 className={clsx('text-2xl', props.className)}>{children}</h1>;
}

type H2Props = PropsWithChildren & React.HTMLAttributes<HTMLHeadingElement>;

export function H2({ children, ...props }: H2Props) {
	return <h2 className={clsx('text-xl', props.className)}>{children}</h2>;
}

type H3Props = PropsWithChildren & React.HTMLAttributes<HTMLHeadingElement>;

export function H3({ children, ...props }: H3Props) {
	return <h3 className={clsx('text-lg', props.className)}>{children}</h3>;
}

type H4Props = PropsWithChildren & React.HTMLAttributes<HTMLHeadingElement>;

export function H4({ children, ...props }: H4Props) {
	return <h4 className={clsx('text-md', props.className)}>{children}</h4>;
}
