import Button from '~/components/html/Button';
import { H1 } from '~/components/html/Headings';
import { ExternalLink } from '~/components/html/Link';
import External from '~/components/icons/External';
import ProjectInfo from '~/components/projects/ProjectInfo';

interface Props {
	project: ProjectResponse;
}

export default function Project({ project }: Props) {
	return (
		<>
			<H1 className='text-primary'>{project.name}</H1>
			<div className='grid grid-cols-10'>
				<div className='col-span-8'>
					<p className='my-4'>
						{project.description}
					</p>

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
					</div>
				</div>

				<ProjectInfo project={project} className='col-span-2' />
			</div>
		</>
	);
}
