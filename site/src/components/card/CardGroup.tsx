import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
	id?: string;
}

export default function CardGroup({ id, children }: Props) {
	return <div id={id} className='grid grid-cols-2 gap-4 mb-4'>
		{children}
	</div>;
}
