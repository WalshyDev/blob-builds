import Paper from '~/components/icons/Paper';

export const DEPENDENCIES: DependencyMap = Object.freeze({
	'paper': {
		link: 'https://papermc.io/',
		icon: <Paper width={12} />,
	},
	'slimefun': {
		link: '/project/Slimefun4',
		icon: <img src='/icons/slimefun.png' className='inline' width={16} />,
	},
});

interface Dependency {
	link: string;
	icon: JSX.Element;
}

type DependencyMap = { [key: string]: Dependency };
