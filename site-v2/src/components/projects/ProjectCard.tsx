import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { Fragment, type PropsWithChildren, type ReactNode } from 'react';
import Button from '~/components/html/Button';
import ButtonLink from '~/components/html/ButtonLink';
import Link from '~/components/html/Link';
import { DEPENDENCIES } from '~/constants/dependencies';

const sideInfo: { [name: string]: (project: Project) => ReactNode } = {
	'Downloads': (project) => project.downloads.toLocaleString(),
	'Supported versions': (project) => project.supportedVersions,
};

interface Props {
	project: Project;
}

export default function ProjectCard({ project }: Props) {
	return (
		// <a href={`/project/${project.name}`}>
		<div className={clsx(
			'w-4/5 p-4 m-auto mb-4',
			'bg-zinc-800 hover:bg-zinc-600 border rounded border-zinc-400',
			'grid grid-cols-10',
		)}>
			<div className='col-span-8'>
				<span className='text-xl text-gray-200'>
					{project.name}
				</span>

				<p className='mt-2'>
					{project.description}
				</p>

				<div className='mt-2 space-x-4'>
					{project.github && <Button>
						GitHub <External />
					</Button>}
					{project.wiki && <Button>
						Wiki <External />
					</Button>}
					<ButtonLink href={`/project/${project.name}`} style='primary'>
						Download
					</ButtonLink>
				</div>
			</div>

			<div className='col-span-2 border-l pl-4 border-l-slate-600'>
				{/* Highlighted detailed */}
				{Object.entries(sideInfo).map(([name, toValue]) =>
					<Fragment key={`span-${project.name}-${name}`}>
						{name} <HighlightedSpan>{toValue(project)}</HighlightedSpan><br />
					</Fragment>,
				)}

				{/* Dependencies */}
				<div className='mt-1'>
					Dependencies
					{project.dependencies && project.dependencies.map((dependency) =>
						<Depedency key={`dep-${project.name}-${dependency}`} name={dependency} />,
					)}
				</div>
			</div>
		</div>
		// </a>
	);
}

function Depedency({ name }: { name: string }) {
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

function HighlightedSpan({ children }: PropsWithChildren) {
	return <span className='text-gray-300'>{children}</span>;
}

function External() {
	return <ArrowTopRightOnSquareIcon width={16} className='inline align-text-top' />;
}
