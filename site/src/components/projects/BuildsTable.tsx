import { DownloadButton } from '~/components/DownloadButton';
import Link from '~/components/Link';
import { Pages } from '~/utils/routes';
import { classNames } from '~/utils/utils';

interface Props {
	builds: BuildList;
	project: string;
}

export function BuildsTable({ builds, project }: Props) {
	return (
		<div className="mt-8 overflow-x-auto inline-block min-w-full align-middle">
			<table className="min-w-full">
				<thead>
					<tr className="bg-table-heading">
						<th
							colSpan={5}
							scope="colgroup"
							className="text-xl font-semibold p-2 text-center"
						>
							{project}
						</th>
					</tr>
				</thead>

				<tbody>
					{Object.keys(builds).map((releaseChannel) => {
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
										{releaseChannel}
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
										<td className="py-2 pl-8 pr-3 font-medium">
											Build {build.buildId}

											{build.releaseNotes && (
												<>
													<br />
													{build.commitHash && build.commitLink && (
														<Link href={build.commitLink}>{build.commitHash?.slice(0, 8)}</Link>
													)}{' '}
													{build.releaseNotes}
												</>
											)}

											{build.supportedVersions && (
												<>
													<br />
													Supported versions: {build.supportedVersions}
												</>
											)}
										</td>

										<td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right font-medium sm:pr-3">
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
				</tbody>
			</table>
		</div>
	);
}
