import ProjectCard from '~/components/projects/ProjectCard';

interface Props {
	owner: string;
	projects: ProjectResponse[];
}

export function ProjectGroup({ owner, projects }: Props) {
	return (
		<div>
			<h3 className='text-2xl text-center text-gray-200 mb-2'>
				{owner}
			</h3>

			{projects.map((project) =>
				<ProjectCard key={`project-${owner}-${project.name}`} project={project} />,
			)}
		</div>
	);
}

export interface ProjectListProps {
	projects: ProjectList;
}

export function ProjectList({ projects }: ProjectListProps) {
	return (
		<>
			{Object.entries(projects)
				.map(([owner, projects]) =>
					<ProjectGroup key={`group-${owner}`} owner={owner} projects={projects} />,
				)
			}
		</>
	);
}
