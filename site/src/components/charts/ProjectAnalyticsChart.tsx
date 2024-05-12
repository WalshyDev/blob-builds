import moment from 'moment';
import { useEffect, useState } from 'react';
import { Legend, BarChart, Tooltip, XAxis, YAxis, Bar, type TooltipProps } from 'recharts';
import { type ApiResponse, type DownloadAnalyticsDataPoint } from '~/api/api';
import TimePicker from '~/components/charts/TimePicker';
import type { TimeWindow } from '@/types/general';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface Props {
	height?: number;
	width?: number;

	projectName: string;
	defaultTimeWindow: TimeWindow;
}

interface ProjectAnalyticsResponse {
	meta: { name: string, type: string }[];
	data: DownloadAnalyticsDataPoint[];
}

export default function ProjectAnalyticsChart({ height, width, projectName, defaultTimeWindow }: Props) {
	const [data, setData] = useState<ChartData[]>([]);
	const [timeWindow, setTimeWindow] = useState(defaultTimeWindow);

	useEffect(() => {
		let analytics: DownloadAnalyticsDataPoint[] = [];
		fetch(`/api/projects/${projectName}/analytics?timeWindow=${timeWindow}`)
			.then((res) => res.json() as Promise<ApiResponse<ProjectAnalyticsResponse>>)
			.then((res) => {
				if (res.success && res.data) {
					analytics = res.data.data;

				}

				setData(convertToChartData(timeWindow, analytics));
			});
	}, [timeWindow]);

	return (
		<div>
			<TimePicker defaultTimeWindow={defaultTimeWindow} timeWindow={timeWindow} setTimeWindow={setTimeWindow} />

			<BarChart
				height={height}
				width={width}
				data={data}
				margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
				className='m-auto'
			>
				<XAxis
					dataKey='timestamp'
					name='Time'
					domain={['auto', 'auto']}
					tickCount={data.length}
					tickFormatter={time}
					type='number'
					scale='utc'
				/>
				<YAxis dataKey='value' minTickGap={1} />
				<Tooltip
					content={
						({ active, payload }: TooltipProps<ValueType, NameType>) => {
							if (active && payload && payload.length === 1) {
								const bar = payload[0] as { payload: { timestamp: number }, value: number };

								return <>
									{time(bar.payload.timestamp)}
									<br />
									Downloads: {bar.value}
								</>;
							}
							return null;
						}
					}
					wrapperStyle={{
						zIndex: 999,
						color: 'black',
						fill: '#fff',
						backgroundColor: '#fff',
						opacity: 0.5,
						borderRadius: '5px',
						padding: '5px',
					}}
					cursor={false}
				/>
				<Legend />
				<Bar
					name='Downloads'
					dataKey='value'
					fill='#82ca9d'
					background={false}
					barSize={50}
				/>
			</BarChart>
		</div>
	);
}

type ChartData = {
	timestamp: number;
	value: number;
}

function convertToChartData(timeWindow: TimeWindow, data: DownloadAnalyticsDataPoint[]): ChartData[] {
	console.log('data', data);
	const mapped = data.map((point) => ({
		// Moment for some reason was setting the hours/mins to now despite us passing 00:00
		// So we force start of day here
		timestamp: moment(point.t).startOf('day').valueOf(),
		value: parseInt(point.downloads),
	}));

	// TODO: Ideally move this server side
	// Fill in missing days
	if ((timeWindow === '7d' && data.length !== 7) || timeWindow === '30d' && data.length !== 30) {
		// Go back in time and add missing days with values of 0
		const daysMissing = (timeWindow === '7d' ? 7 : 30) - mapped.length;
		const start = moment().utc().startOf('day').valueOf();
		for (let i = 1; i < (daysMissing + 1); i++) {
			mapped.push({ timestamp: start - (i * 86400000), value: 0 });
		}
	}

	return mapped;
}

function time(timestamp: number) {
	return moment(timestamp).format('DD MMMM');
}
