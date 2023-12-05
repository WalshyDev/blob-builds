import { PropsWithChildren } from 'react';
import { classNames } from '~/utils/utils';

interface HeaderProps extends PropsWithChildren {
	className?: string;
}

const sharedStyles = 'my-4 text-stone-600 dark:text-slate-200';

export function H1({ className, children }: HeaderProps) {
	return <h1 className={classNames('text-4xl', sharedStyles, className)}>{children}</h1>;
}

export function H2({ className, children }: HeaderProps) {
	return <h2 className={classNames('text-3xl', sharedStyles, className)}>{children}</h2>;
}

export function H3({ className, children }: HeaderProps) {
	return <h3 className={classNames('text-2xl', sharedStyles, className)}>{children}</h3>;
}

export function H4({ className, children }: HeaderProps) {
	return <h4 className={classNames('text-xl', sharedStyles, className)}>{children}</h4>;
}
