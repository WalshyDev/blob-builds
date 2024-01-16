import clsx from 'clsx';
import External from '~/components/icons/External';
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

interface ExternalLinkProps extends Props {
	showIcon?: boolean;
}

export function ExternalLink({ showIcon = true, children, ...props }: ExternalLinkProps) {
	return <>
		<Link {...props} target='_blank'>
			{children}
		</Link>
		{showIcon && <External />}
	</>;
}
