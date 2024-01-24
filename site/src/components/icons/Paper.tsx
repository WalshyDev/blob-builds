import clsx from 'clsx';

interface Props {
	height?: string | number;
	width?: string | number;
	className?: string;
}

export default function Paper({ height, width, className }: Props) {
	return (
		<svg
			xmlns='http://www.w3.org/2000/svg'
			fill='none'
			viewBox='0 0 24 24'
			height={height}
			width={width}
			className={clsx('inline', className)}
		>
			<path
				fill='#fff'
				d={
					'M23.987 1.004 20.56 21.576a.858.858 0 0 1-.844.71.921.921 0 0 1-.322-.068l-6.067-2.477-3.24 3.95a.83.83 0 0 '
					+ '1-.657.309.763.763 0 0 1-.295-.054.854.854 0 0 1-.562-.803V18.47L20.143 4.286 5.827 '
					+ '16.674l-5.29-2.17A.848.848 0 0 1 0 13.768a.865.865 0 0 1 .429-.79L22.715.12a.83.83 0 0 1 '
					+ '.428-.12.853.853 0 0 1 .844 1.004'
				}
			>
			</path>
		</svg>
	);
}
