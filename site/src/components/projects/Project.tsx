import { H1 } from '~/components/html/Headings';
import ProjectInfo from '~/components/projects/ProjectInfo';
import ProjectLinks from '~/components/projects/ProjectLinks';

interface Props {
	project: ProjectResponse;
}

export default function Project({ project }: Props) {
	return (
		<>
			<H1 className='text-primary'>{project.name}</H1>
			<div className='md:grid md:grid-cols-10'>
				<div className='md:col-span-8'>
					<p className='my-4'>
						{project.description}
					</p>

					<ProjectLinks project={project} />
				</div>

				<ProjectInfo project={project} className='md:col-span-2 my-2 md:my-0' />
			</div>
		</>
	);
}
