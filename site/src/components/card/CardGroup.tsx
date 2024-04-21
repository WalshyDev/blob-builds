import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {}

export default function CardGroup({ children }: Props) {
	return <div className='grid grid-cols-2 gap-4 mb-4'>
		{children}
	</div>;
}
