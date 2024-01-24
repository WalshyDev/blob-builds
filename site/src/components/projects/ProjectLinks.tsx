import Button from '~/components/html/Button';
import ButtonLink from '~/components/html/ButtonLink';
import { ExternalLink } from '~/components/html/Link';
import External from '~/components/icons/External';

interface Props {
	project: ProjectResponse;
	download?: boolean;
}

export default function ProjectLinks({ project, download }: Props) {
	return (
		<div className='my-4 space-x-4'>
			{project.repoLink && <ExternalLink href={project.repoLink} inheritColor showIcon={false}>
				<Button>
					Repository <External />
				</Button>
			</ExternalLink>}
			{project.wikiLink && <ExternalLink href={project.wikiLink} inheritColor showIcon={false}>
				<Button>
					Wiki <External />
				</Button>
			</ExternalLink>}

			{download && <ButtonLink href={`/project/${project.name}`} style='primary'>
					Download
			</ButtonLink>}
		</div>
	);
}
