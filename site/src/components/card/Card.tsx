import clsx from 'clsx';
import { H2 } from '~/components/html/Headings';
import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
	title?: string;
}

export default function Card({ title, children }: Props) {
	return <div className={clsx(
		'p-2 border rounded',
		'bg-secondary hover:bg-lighter border-zinc-700',
	)}>
		{title &&
			<>
				<H2 className='mb-2'>
					{title}
				</H2>

				<hr className='border border-default w-4/5 m-auto my-2' />
			</>
		}

		{children}
	</div>;
}
