import clsx from 'clsx';
import Depedency from '~/components/Dependency';
import HighlightedSpan from '~/components/html/HighlightedSpan';
import type { ReactNode } from 'react';

const sideInfo: { [name: string]: (project: ProjectResponse, releaseChannel: ReleaseChannel) => ReactNode } = {
	// 'Downloads': (project) => project.downloads.toLocaleString(),
	'Supported versions': (_, releaseChannel) => releaseChannel.supportedVersions,
};

interface Props {
	project: ProjectResponse;
	className?: string;
}

export default function ProjectInfo({ project, className }: Props) {
	const releaseChannel = project.defaultReleaseChannel;

	if (releaseChannel === null) {
		return null;
	}

	return (
		<div className={clsx(className, 'border-l pl-4 border-l-slate-600')}>
			{/* Highlighted detailed */}
			{Object.entries(sideInfo).map(([name, toValue]) =>
				<HighlightedSpan key={`info-${project.name}-${name}`} prefix={name} className='block'>
					{toValue(project, releaseChannel)} {/* TODO */}
				</HighlightedSpan>,
			)}

			{/* Dependencies */}
			{releaseChannel.dependencies && releaseChannel.dependencies.length > 0 &&
				<div className='mt-1'>
					Dependencies
					{releaseChannel.dependencies && releaseChannel.dependencies.map((dependency) =>
						<Depedency key={`dep-${project.name}-${dependency}`} name={dependency} />,
					)}
				</div>
			}
		</div>
	);
}
