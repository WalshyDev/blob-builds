import ButtonLink from '~/components/html/ButtonLink';
import { H3 } from '~/components/html/Headings';
import HighlightedSpan from '~/components/html/HighlightedSpan';
import Link from '~/components/html/Link';

interface Props {
	project: ProjectResponse;
	build: BuildResponse;
}

export default function BuildCard({ build }: Props) {
	return (
		<div className='bg-zinc-800 hover:bg-zinc-700 border rounded border-zinc-700 p-4 my-4'>
			<Link href={build.fileDownloadUrl}>
				<H3>
					Build {build.buildId}
				</H3>
			</Link>

			<p className='my-2'>
				{build.commitHash && build.commitLink && (
					<Link href={build.commitLink}>{build.commitHash.substring(0, 8)}</Link>
				)}
				{build.commitHash && build.commitLink && build.releaseNotes && ' '}
				{/* {renderReleaseNotes(project, build)} */}
				{build.releaseNotes}
			</p>

			<div className='my-2'>
				<HighlightedSpan prefix='Supported versions'>{build.supportedVersions}</HighlightedSpan>
			</div>

			<div>
				<ButtonLink href={build.fileDownloadUrl} style='primary'>
					Download
				</ButtonLink>
			</div>
		</div>
	);
}
