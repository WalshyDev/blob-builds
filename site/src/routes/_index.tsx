import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { getProjects } from '~/api/api';
import { ProjectsTable } from '~/components/projects/ProjectsTable';
import type { ProjectList} from 'worker/src/store/ProjectStore';

export const loader: LoaderFunction<ProjectList | { error: string }> = async (args) => {
	const projects = await getProjects(args);
	if (projects.success) {
		return json(projects.data);
	}

	return json({ error: projects.error });
};

export default function Index() {
	const projects = useLoaderData<ProjectList>();

	// TODO: Temp, remove and properly handle errors
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (projects.error !== undefined) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return <p>Error: {projects.error}</p>;
	}

	return <ProjectsTable projectList={projects} />;
}
