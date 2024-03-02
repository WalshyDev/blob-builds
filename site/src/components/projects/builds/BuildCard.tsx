import Markdown from 'react-markdown';
import ButtonLink from '~/components/html/ButtonLink';
import { H3 } from '~/components/html/Headings';
import HighlightedSpan from '~/components/html/HighlightedSpan';
import Link, { ExternalLink } from '~/components/html/Link';

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

				{build.releaseNotes && <ReleaseNotes releaseNotes={build.releaseNotes} />}
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

// log props to see what we can use
function ReleaseNotes({ releaseNotes }: { releaseNotes: string }) {
	return <Markdown
		allowedElements={['ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'p', 'span', 'div']}
		skipHtml={true}
		components={{
			// Style lists
			ul({ children }) {
				return <div className='list-disc'>{children}</div>;
			},
			ol({ children }) {
				return <div className='list-decimal'>{children}</div>;
			},
			// Make all links marked as external
			a({ href, children }) {
				return <ExternalLink href={href ?? '#'}>{children}</ExternalLink>;
			},
			// We won't render headers, instead just make them bold
			h1({ children }) {
				return <div className='font-bold'>{children}</div>;
			},
			h2({ children }) {
				return <div className='font-bold'>{children}</div>;
			},
			h3({ children }) {
				return <div className='font-bold'>{children}</div>;
			},
			h4({ children }) {
				return <div className='font-bold'>{children}</div>;
			},
			// We disallow html but for extra measure kill script
			script() {
				return null;
			},
		}}
	>
		{releaseNotes}
	</Markdown>;
}
