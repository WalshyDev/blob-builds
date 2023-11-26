import { json } from '@remix-run/cloudflare';
import { useLoaderData, useParams } from '@remix-run/react';
import { getAllBuildsPerProject } from '~/api/api';
import { BuildsTable } from '~/components/projects/BuildsTable';

export const loader: LoaderFunction<BuildList | { error: string }> = async ({ context, params }) => {
	const builds = await getAllBuildsPerProject(context, params.project!);
	if (builds.success) {
		return json(builds.data);
	}

	return json({ error: builds.error });
};

export default function Resource() {
	const params = useParams();
	const builds = useLoaderData<BuildList>();

	// TODO: Temp, remove and properly handle errors
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (builds.error !== undefined) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return <p>Error: {builds.error}</p>;
	}

	return <BuildsTable builds={builds} project={params.project!} />;
}
