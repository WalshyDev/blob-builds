import { useEffect, useState } from 'react';
import { buildProjectList } from '~/api/utils';
import { ProjectList } from '~/components/projects/ProjectGroup';
import SearchBar from '~/components/search/SearchBar';
import type { ApiResponse } from '~/api/api';
import type { SearchBarProps } from '~/components/search/SearchBar';

type Props = {
	projects: ProjectList;
	'client:load': boolean;
} & SearchBarProps;

export default function UniversalSearch({ projects: projectList, ...searchBarProps }: Props) {
	const [search, setSearch] = useState('');
	const [projects, setProjects] = useState<ProjectList>(projectList);

	useEffect(() => {
		console.log('searching', search);
		if (!search) {
			return;
		}

		fetch('/api/search', {
			method: 'POST',
			body: JSON.stringify({ query: search }),
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((res) => res.json() as Promise<ApiResponse<ProjectResponse[]>>)
			.then((json) => {
				console.log('json', json);
				if (json.success === true) {
					const projectList = buildProjectList(json.data);

					console.log('set projects', projectList);
					setProjects(projectList);
				} else{
					console.error('Failed to search for projects:', json.error);
					setProjects({});
				}
			});
	}, [search]);

	return (
		<>
			<SearchBar
				{...searchBarProps}
				onChange={(event) => setSearch(event.target.value)}
			/>

			<ProjectList projects={projects} />
		</>
	);
}
