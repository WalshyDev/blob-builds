import { Fragment } from 'react';
import { DownloadButton } from '~/components/DownloadButton';
import Constants from '~/utils/constants';
import { Pages } from '~/utils/routes';
import { classNames } from '~/utils/utils';
import type { ProjectList } from 'worker/src/store/projects';

interface ProjectsByOwner {
	name: string;
	projects: { name: string, releaseChannels: string[] }[];
}

export function projectListToProjectsByOwner(list: ProjectList): ProjectsByOwner[] {
	const arr: ProjectsByOwner[] = [];

	for (const project of list) {
		const existingOwner = arr.find((owner) => owner.name === project.project_owner);
		if (existingOwner) {
			existingOwner.projects.push({
				name: project.project_name,
				releaseChannels: project.release_channels,
			});
		} else {
			arr.push({
				name: project.project_owner,
				projects: [ { name: project.project_name, releaseChannels: project.release_channels } ],
			});
		}
	}

	return arr;
}

interface Props {
	projectList: ProjectList;
}

export function ProjectsTable({ projectList }: Props) {
	const projectsByOwner = projectListToProjectsByOwner(projectList);
	console.log(projectsByOwner);

	return (
		<div className="mt-8 overflow-x-auto inline-block min-w-full align-middle">
			<table className="min-w-full">
				{projectsByOwner.map((owner) => (
					<Fragment key={`owner-${owner.name}`}>
						<thead>
							<tr className="bg-table-heading">
								<th
									colSpan={5}
									scope="colgroup"
									className="text-xl font-semibold p-2 text-center"
								>
									{owner.name}
								</th>
							</tr>
						</thead>
						<tbody>
							{owner.projects.map((project) => <ProjectRow
								key={`project-${project.name}`}
								project={project.name}
								releaseChannels={project.releaseChannels ?? [Constants.DEFAULT_RELEASE_CHANNEL]}
							/> )}
						</tbody>
					</Fragment>
				))}
			</table>
		</div>
	);
}

interface ProjectRowProps {
	project: string;
	releaseChannels: string[];
}

export function ProjectRow({ project, releaseChannels }: ProjectRowProps) {
	/*if (releaseChannels.length === 1) {
		return (
			<tr
				key={project}
				className={classNames(
					'border-t-2 border-table-border',
					'bg-table-primary-row hover:bg-table-hover',
				)}
			>
				<td className="whitespace-nowrap py-4 pl-4 pr-3 font-medium sm:pl-3">
					{project} ({releaseChannels[0]})
				</td>

				<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right font-medium sm:pr-3">
					<DownloadButton latest={true} downloadLink={Pages.downloadLatestBuild.toUrl({
						projectName: project,
						releaseChannel: releaseChannels[0],
					})} />
				</td>
			</tr>
		);
	}*/

	return (
		<>
			<tr
				key={project}
				className={classNames(
					'border-t-2 border-table-border',
					'bg-table-primary-row hover:bg-table-hover',
				)}
			>
				<td className="whitespace-nowrap py-2 pl-4 pr-3 font-medium sm:pl-3">
					{project}
				</td>
				<td></td>
			</tr>

			{releaseChannels.map((releaseChannel) =>
				<tr
					key={`${project}-${releaseChannel}`}
					className={classNames(
						'border-t-2 border-table-border',
						'bg-table-secondary-row hover:bg-table-hover',
					)}
				>
					<td className="whitespace-nowrap py-2 pl-8 pr-3 font-medium">
						↳ {releaseChannel}
					</td>

					<td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right font-medium sm:pr-3">
						{/* <DownloadButton latest={true} downloadLink={Pages.downloadLatestBuild.toUrl({
							projectName: project,
							releaseChannel,
						})} /> */}

						<DownloadButton
							latest={true}
							downloadLink={Pages.downloadLatestBuild.toUrl({ projectName: project, releaseChannel })}
						/>
					</td>
				</tr>,
			)}
		</>
	);
}
