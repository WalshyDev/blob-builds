import HighlightedSpan from '~/components/html/HighlightedSpan';
import Link from '~/components/html/Link';
import { DEPENDENCIES } from '~/constants/dependencies';

export default function Depedency({ name }: { name: string }) {
	const dep = DEPENDENCIES[name.toLowerCase()];

	return <span className='block pl-2'>
		{dep !== undefined
			? <>
				{dep.icon} <Link href={dep.link}>
					{name}
				</Link>
			</>
			: <HighlightedSpan>{name}</HighlightedSpan>
		}
	</span>;
}
