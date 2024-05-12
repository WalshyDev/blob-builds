import { TimeWindow } from 'src/types/general';

export function isValidTimeWindow(str: string | undefined | null) {
	if (str === '7d' || str === '30d') {
		return true;
	}
	return false;
}

export function timeWindowToChInterval(timeWindow: TimeWindow) {
	switch (timeWindow) {
	case '7d':
		return 'INTERVAL \'7\' DAY';
	case '30d':
		return 'INTERVAL \'30\' DAY';
	}
}
