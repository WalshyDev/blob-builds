import { DownloadButton } from '~/components/DownloadButton';
import { Pages } from '~/utils/routes';
import { classNames } from '~/utils/utils';

interface Props {
	builds: BuildList;
	project: string;
}

export function ProjectTable({ builds, project }: Props) {

	return (
		<div className="mt-8 overflow-x-auto inline-block min-w-full align-middle">
			<table className="min-w-full">
				<ProjectRow project={project} releaseChannels={Object.keys(builds)} builds={builds}/>
			</table>
		</div>
	);
}

interface ProjectRowProps {
	project: string;
	releaseChannels: string[];
	builds: BuildList;
}

export function ProjectRow({ project, releaseChannels, builds }: ProjectRowProps) {
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
			{releaseChannels.map((releaseChannel) => {
				return (
					<>
						<tr
							key={`${project}-${releaseChannel}`}
							className={classNames(
								'border-t-2 border-table-border',
								'bg-table-primary-row hover:bg-table-hover',
							)}
						>
							<td className="whitespace-nowrap py-2 pl-4 pr-3 font-medium sm:pl-3">
								{project} {releaseChannel}
							</td>
							<td></td>
						</tr>
						{builds[releaseChannel].map((build) =>
							<tr
								key={`${project}-${build.buildId}`}
								className={classNames(
									'border-t-2 border-table-border',
									'bg-table-secondary-row hover:bg-table-hover',
								)}
							>
								<td className="whitespace-nowrap py-2 pl-8 pr-3 font-medium">
									↳ {build.buildId}
								</td>

								<td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right font-medium sm:pr-3">
									{/* <DownloadButton latest={true} downloadLink={Pages.downloadLatestBuild.toUrl({
										projectName: project,
										releaseChannel,
									})} /> */}

									<DownloadButton
										latest={false}
										downloadLink={Pages.downloadSpecificBuild.toUrl({
											projectName: project,
											releaseChannel,
											version: String(build.buildId),
										})}
									/>
								</td>
							</tr>,
						)}
					</>
				);
			})}
		</>
	);
}
