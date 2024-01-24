import clsx from 'clsx';

const link = (project: ProjectResponse, channel: string) => `/project/${project.name}/${channel}`;

interface Props {
	project: ProjectResponse;
	selected: string;
	defaultReleaseChannel: string;
	releaseChannels: string[];
}

export default function ProjectBuilds({ project, selected, defaultReleaseChannel, releaseChannels }: Props) {
	return (
		<div>
			{/* Mobile */}
			<div className='sm:hidden'>
				<label htmlFor='tabs' className='sr-only'>
					Select a tab
				</label>
				{/* Use an 'onChange' listener to redirect the user to the selected tab URL. */}
				<select
					id='tabs'
					name='tabs'
					className={clsx(
						'block w-full rounded-md border-gray-300 py-2 pl-3 pr-10',
						'text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm',
					)}
					defaultValue={defaultReleaseChannel}
				>
					{releaseChannels.map((channel) => (
						<option key={`rc-tab-${channel}`}>{channel}</option>
					))}
				</select>
			</div>

			{/* Desktop */}
			<div className='hidden sm:block'>
				<div className='border-b border-zinc-400'>
					<nav className='-mb-px flex space-x-8' aria-label='Tabs'>
						{releaseChannels.map((channel) => (
							<a
								key={`rc-link-${channel}`}
								href={link(project, channel)}
								className={clsx(
									channel === selected
										? 'border-gray-300 text-primary'
										: 'border-transparent text-default hover:border-gray-300 hover:text-primary',
									'whitespace-nowrap border-b-2 py-4 px-1 text-l font-medium',
								)}
								aria-current={channel === selected ? 'page' : undefined}
							>
								{channel}
							</a>
						))}
					</nav>
				</div>
			</div>
		</div>
	);
}
