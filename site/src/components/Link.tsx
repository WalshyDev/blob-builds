import { PropsWithChildren } from 'react';

interface Props {
	href: string;
}

export default function Link({ href, children }: PropsWithChildren<Props>) {
	return <a href={href} className='underline text-blue-300'>{children}</a>;
}
