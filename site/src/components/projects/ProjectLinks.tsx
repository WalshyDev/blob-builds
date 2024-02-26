import Button from '~/components/html/Button';
import ButtonLink from '~/components/html/ButtonLink';
import { ExternalLink } from '~/components/html/Link';
import External from '~/components/icons/External';

interface Props {
	project: ProjectResponse;
	viewBuilds?: boolean;
}

export default function ProjectLinks({ project, viewBuilds }: Props) {
	return (
		<div className='my-4 space-x-2 md:space-x-4'>
			{viewBuilds && <ButtonLink href={`/project/${project.name}`} style='primary'>
					Builds
			</ButtonLink>}

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
		</div>
	);
}
