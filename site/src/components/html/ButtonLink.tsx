import Button from '~/components/html/Button';
import type { Props as ButtonProps } from '~/components/html/Button';

interface Props extends ButtonProps {
	href: string;
}

export default function ButtonLink({ href, children, ...props }: Props) {
	return (
		<a href={href}>
			<Button {...props}>
				{children}
			</Button>
		</a>
	);
}
