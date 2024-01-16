import clsx from 'clsx';
import Depedency from '~/components/Dependency';
import HighlightedSpan from '~/components/html/HighlightedSpan';
import type { ReactNode } from 'react';

const sideInfo: { [name: string]: (project: Project) => ReactNode } = {
	'Downloads': (project) => project.downloads.toLocaleString(),
	'Supported versions': (project) => project.supportedVersions,
};

interface Props {
	project: Project;
	className?: string;
}

export default function ProjectInfo({ project, className }: Props) {
	return (
		<div className={clsx(className, 'border-l pl-4 border-l-slate-600')}>
			{/* Highlighted detailed */}
			{Object.entries(sideInfo).map(([name, toValue]) =>
				<HighlightedSpan key={`info-${project.name}-${name}`} prefix={name} className='block'>
					{toValue(project)}
				</HighlightedSpan>,
			)}

			{/* Dependencies */}
			<div className='mt-1'>
				Dependencies
				{project.dependencies && project.dependencies.map((dependency) =>
					<Depedency key={`dep-${project.name}-${dependency}`} name={dependency} />,
				)}
			</div>
		</div>
	);
}
