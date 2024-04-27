import { EyeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Icons {
	[key: string]: JSX.Element;
}

const icons: Icons = {
	'eye': <EyeIcon />,
};

interface IconProps {
	name?: string | undefined;
	icon?: keyof typeof icons;
	iconPosition?: 'left' | 'right';
	iconClickable?: boolean | undefined;
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement>, IconProps {
	name?: string | undefined;
	label?: string;
	labelClassName?: string;
	hidden?: boolean;
}

export default function Input({
	name,
	label,
	labelClassName,
	icon,
	iconPosition = 'left',
	iconClickable,
	className,
	...props
}: Props) {
	return <div>
		{label && <label htmlFor={name} className={labelClassName}>
			{label}
		</label>}

		<div className='relative'>
			{icon && iconPosition === 'left' && <Icon name={name} icon={icon} iconClickable={iconClickable} />}
			<input
				{...props}
				id={name}
				name={name}
				className={clsx(
					'w-full p-2 rounded border border-default bg-default',
					icon && iconPosition === 'left' && 'pl-10',
					icon && iconPosition === 'right' && 'pr-10',
					className,
				)}
			/>
			{icon && iconPosition === 'right' && <Icon name={name} icon={icon} iconClickable={iconClickable} />}
		</div>
	</div>;
}

function Icon({ name, icon, iconClickable }: IconProps) {
	return <span
		id={`${name}-icon`}
		/* mt-1 to center in input -- kinda jank, probably a better way but this works for now */
		className={clsx(
			'absolute w-8 h-8 inset-y-0 right-0 mt-1',
			iconClickable && 'cursor-pointer',
		)}
	>
		{icon && icons[icon]}
	</span>;
}
