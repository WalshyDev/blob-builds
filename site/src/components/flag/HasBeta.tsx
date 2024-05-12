import type { PropsWithChildren } from 'react';
import BetaFlag, { hasBeta } from '@/flags/BetaFlags';

interface Props extends PropsWithChildren {
	flag: BetaFlag;
	betaFlags: string[];
}

export default function HasBeta({ flag, betaFlags, children }: Props) {
	if (hasBeta(betaFlags, flag)) {
		return children;
	}

	return null;
}
