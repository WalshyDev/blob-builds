import clsx from 'clsx';
import Link from '~/components/html/Link';
import ProjectInfo from '~/components/projects/ProjectInfo';
import ProjectLinks from '~/components/projects/ProjectLinks';

interface Props {
	project: ProjectResponse;
}

export default function ProjectCard({ project }: Props) {
	return (
		<div className={clsx(
			'w-4/5 p-4 m-auto mb-4',
			'bg-zinc-800 hover:bg-zinc-700 border rounded border-zinc-700',
			'grid grid-cols-10',
		)}>
			<div className='col-span-8'>
				<Link href={`/projects/${project.name}`}>
					<span className='text-xl text-gray-200'>
						{project.name}
					</span>
				</Link>

				<p className='mt-2'>
					{project.description}
				</p>

				<ProjectLinks project={project} download />
			</div>

			<ProjectInfo project={project} className='col-span-2' />
		</div>
	);
}
