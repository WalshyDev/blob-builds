import { useEffect, useState } from 'react';
import { ProjectList } from '~/components/projects/ProjectGroup';
import SearchBar from '~/components/search/SearchBar';
import type { SearchBarProps } from '~/components/search/SearchBar';

type Props = {
	projects: ProjectList;
	'client:load': boolean;
} & SearchBarProps;

export default function UniversalSearch({ projects, ...searchBarProps }: Props) {
	const [search, setSearch] = useState('');

	useEffect(() => {
		console.log('searching', search);
		if (!search) {
			return;
		}

		// fetch('/api/search', {
		// 	method: 'POST',
		// 	body: JSON.stringify({ query: search }),
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 	},
		// })
		// 	.then(async (res) => console.log(await res.text()));
		// .then((res) => res.json())
		// .then((json) => console.log(json));
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
