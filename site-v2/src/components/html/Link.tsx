import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren, React.AnchorHTMLAttributes<HTMLAnchorElement> {
	className?: string;
	inheritColor?: boolean;
	href: string;
}

export default function Link({ href, className, inheritColor, children, ...props }: Props) {
	return <a
		className={clsx(inheritColor ? '' : 'text-blue-400 underline', className)}
		href={href}
		{...props}
	>
		{children}
	</a>;
}
