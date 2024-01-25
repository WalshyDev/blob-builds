import clsx from 'clsx';
import Link from '~/components/html/Link';
import type { PropsWithChildren } from 'react';

interface Props {
	currentPage: number;
	totalPages: number;
}

export function Pagination({ currentPage, totalPages }: Props) {
	console.log('pagination!', { currentPage, totalPages });
	return (
		<div className='my-4 table mx-auto space-x-4'>

			{currentPage > 1 && <Block>
				<Link href={`?page=${currentPage - 1}`}>
					Previous page
				</Link>
			</Block>}

			<Block>
				{currentPage}
			</Block>

			{currentPage < totalPages && <Block>
				<Link href={`?page=${currentPage + 1}`}>
					Next page
				</Link>
			</Block>}
		</div>
	);
}

function Block({ children }: PropsWithChildren) {
	return <span className={clsx(
		'w-4 p-2 bg-zinc-800 text-center',
		'border rounded border-zinc-600',
	)}>
		{children}
	</span>;
}
