import ButtonLink from '~/components/html/ButtonLink';

interface Props {
	projects: ProjectResponse[];
}

export function ProjectList({ projects }: Props) {
	return (
		<div>
			{projects.map((project) => (
				<ButtonLink
					key={`panel-project-list-${project.name}`}
					href={`/panel/project/${project.name}`}
					style='primary'
				>
					{project.name}
				</ButtonLink>
			))}
		</div>
	);
}
