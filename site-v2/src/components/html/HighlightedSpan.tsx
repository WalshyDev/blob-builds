import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
	className?: string;
	prefix?: string;
}

export default function HighlightedSpan({ className, prefix, children }: Props) {
	return <span className={clsx(className)}>
		{prefix && prefix + ' '}
		<span className={'text-primary'}>{children}</span>
	</span>;
}
