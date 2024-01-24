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
			<div className='grid grid-cols-10'>
				<div className='col-span-8'>
					<p className='my-4'>
						{project.description}
					</p>

					<ProjectLinks project={project} />
				</div>

				<ProjectInfo project={project} className='col-span-2' />
			</div>
		</>
	);
}
