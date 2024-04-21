import GitHub from '~/components/icons/GitHub';

interface Props {
	provider: string;
	icon?: boolean;
}

export default function OAuthProvider({ provider, icon = true }: Props) {
	if (provider === 'github') {
		return <span>GitHub {icon && <GitHub />}</span>;
	}

	return null;
}
