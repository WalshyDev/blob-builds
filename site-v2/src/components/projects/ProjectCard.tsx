import clsx from 'clsx';
import Button from '~/components/html/Button';
import ButtonLink from '~/components/html/ButtonLink';
import External from '~/components/icons/External';
import ProjectInfo from '~/components/projects/ProjectInfo';

interface Props {
	project: Project;
}

export default function ProjectCard({ project }: Props) {
	return (
		<div className={clsx(
			'w-4/5 p-4 m-auto mb-4',
			'bg-zinc-800 hover:bg-zinc-700 border rounded border-zinc-700',
			'grid grid-cols-10',
		)}>
			<div className='col-span-8'>
				<span className='text-xl text-gray-200'>
					{project.name}
				</span>

				<p className='mt-2'>
					{project.description}
				</p>

				<div className='mt-2 space-x-4'>
					{project.github && <Button>
						GitHub <External />
					</Button>}
					{project.wiki && <Button>
						Wiki <External />
					</Button>}
					<ButtonLink href={`/project/${project.name}`} style='primary'>
						Download
					</ButtonLink>
				</div>
			</div>

			<ProjectInfo project={project} className='col-span-2' />
		</div>
	);
}
