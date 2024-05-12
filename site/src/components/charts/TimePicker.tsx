import type { TimeWindow } from '@/types/general';

interface Props {
	defaultTimeWindow: TimeWindow;
	timeWindow: TimeWindow;
	setTimeWindow: (timeWindow: TimeWindow) => void;
}

export default function TimePicker({ defaultTimeWindow, timeWindow, setTimeWindow }: Props) {
	return (
		<div className='float-right'>
			<select
				name='timeWindow'
				defaultValue={defaultTimeWindow}
				value={timeWindow}
				onChange={(event) => setTimeWindow(event.target.value as TimeWindow)}
			>
				<option value='7d'>7 Days</option>
				<option value='30d'>30 Days</option>
			</select>
		</div>
	);
}
