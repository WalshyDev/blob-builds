import { useEffect, useState } from 'react';
import Input from '~/components/html/Input';

export interface SearchBarProps {
	className?: string;
	name?: string;
	placeholder?: string;
	hideWithoutJs?: boolean;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SearchBar({ className, name, placeholder, hideWithoutJs, onChange }: SearchBarProps) {
	const [hidden, setHidden] = useState(hideWithoutJs);
	// We're in client-side land, we can render the search
	useEffect(() => {
		if (hidden === true && typeof window !== 'undefined') {
			hideWithoutJs = false;
			setHidden(false);
		}
	}, []);

	return (
		<div className={className}>
			<Input
				name={name}
				placeholder={placeholder}
				className={hidden ? 'hidden' : ''}
				onChange={onChange}
			/>
		</div>
	);
}
