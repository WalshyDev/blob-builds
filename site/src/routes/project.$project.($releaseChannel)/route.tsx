import { json } from '@remix-run/cloudflare';
import { useLoaderData, useParams } from '@remix-run/react';
import { getAllBuildsPerProject } from '~/api/api';
import { BuildsTable } from '~/components/projects/BuildsTable';

export const loader: LoaderFunction<BuildList | { error: string }> = async (args) => {
	if (!args.params.project) {
		return json({ error: 'No project provided' });
	}

	const builds = await getAllBuildsPerProject(args, args.params.project, args.params.releaseChannel);
	if (builds.success) {
		const buildList = builds.data ?? {};
		for (const channel of Object.keys(buildList)) {
			if (buildList[channel].length > 100) {
				buildList[channel] = buildList[channel].slice(0, 100);
			}
		}

		return json(buildList);
	}

	return json({ error: builds.error });
};

export default function ProjectBuilds() {
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
