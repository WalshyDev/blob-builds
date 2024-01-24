import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

export interface Props extends PropsWithChildren {
	className?: string;
	style?: 'primary' | 'secondary';
}

export default function Button({ children, className, style = 'secondary' }: Props) {
	return (
		<button className={clsx(
			'px-2 py-1',
			'border rounded border-zinc-600 hover:border-zinc-400 text-zinc-300',
			style === 'primary' ?
				'bg-blue-600 hover:bg-blue-500'
				: 'bg-zinc-900 hover:bg-zinc-700',
			className,
		)}>
			{children}
		</button>
	);
}
