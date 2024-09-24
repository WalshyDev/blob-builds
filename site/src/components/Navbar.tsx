import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { H1 } from '~/components/html/Headings';

interface Item {
	name: string;
	href: string;
	current?: boolean;
}

const navigation: Item[] = [
	{ name: 'Projects', href: '/' },
	{ name: 'Developers', href: '/docs' },
];

const logedInNavItems: Item[] = [
	{ name: 'Create', href: '/create'},
	{ name: 'Control Panel', href: '/panel' },
	{ name: 'Settings', href: '/account' },
];

interface Props {
	loggedIn: boolean;
}

export default function Navbar({ loggedIn }: Props) {
	return (
		<Disclosure as="nav" className="bg-zinc-800 mb-6">
			{({ open }) => (
				<>
					<div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
						<div className="relative flex h-16 items-center justify-between">
							<div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
								{/* Mobile menu button*/}
								<Disclosure.Button className={clsx(
									'relative inline-flex items-center justify-center rounded-md p-2',
									'text-gray-400 hover:bg-gray-700 hover:text-white',
									'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white',
								)}>
									<span className="absolute -inset-0.5" />
									<span className="sr-only">Open main menu</span>
									{open ? (
										<XMarkIcon className="block h-6 w-6" aria-hidden="true" />
									) : (
										<Bars3Icon className="block h-6 w-6" aria-hidden="true" />
									)}
								</Disclosure.Button>
							</div>
							<div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
								<H1 className='text-primary'>
									<a href='/'>Blob Builds</a>
								</H1>
								<div className="hidden sm:ml-6 sm:block">
									<div className="flex space-x-4">
										{navigation.map((item) => (
											<NavItem
												key={`navitem-${item.name}`}
												name={item.name}
												href={item.href}
												current={item.current}
											/>
										))}
									</div>
								</div>
							</div>
							<div
								className={clsx(
									'hidden sm:block absolute',
									'inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0',
								)}
							>
								{loggedIn
									? <>
										{logedInNavItems.map((item) => (
											<NavItem
												key={`navitem-${item.name}`}
												name={item.name}
												href={item.href}
												current={item.current}
											/>
										))}
									</>
									: <a
										href='/login'
										className={clsx(
											'text-primary hover:bg-zinc-700 hover:text-white',
											'rounded-md px-3 py-2 text-sm font-medium',
										)}
									>
										Login
									</a>
								}
							</div>
						</div>
					</div>

					<Disclosure.Panel className="sm:hidden">
						<div className="space-y-1 px-2 pb-3 pt-2">
							{navigation.map((item) => (
								<Disclosure.Button
									key={`mobildenav-${item.name}`}
									as="a"
									href={item.href}
									className={clsx(
										item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
										'block rounded-md px-3 py-2 text-base font-medium',
									)}
									aria-current={item.current ? 'page' : undefined}
								>
									{item.name}
								</Disclosure.Button>
							))}

							<hr />

							{loggedIn
								? <>
									{logedInNavItems.map((item) => (
										<Disclosure.Button
											key={`mobildenav-${item.name}`}
											as="a"
											href={item.href}
											className={clsx(
												item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
												'block rounded-md px-3 py-2 text-base font-medium',
											)}
											aria-current={item.current ? 'page' : undefined}
										>
											{item.name}
										</Disclosure.Button>
									))}
								</>
								: <Disclosure.Button
									key={'mobile-nav-login'}
									as="a"
									href='/login'
									className={clsx(
										'text-gray-300 hover:bg-gray-700 hover:text-white',
										'block rounded-md px-3 py-2 text-base font-medium',
									)}
								>
									Login
								</Disclosure.Button>
							}
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	);
}

interface NavItemProps {
	name: string;
	href: string;
	current?: boolean | undefined;
}

function NavItem({ name, href, current }: NavItemProps) {
	return <a
		href={href}
		className={clsx(
			current ? 'bg-zinc-900 text-primary' : 'text-default hover:bg-zinc-700 hover:text-white',
			'rounded-md px-3 py-2 text-sm font-medium',
		)}
		aria-current={current ? 'page' : undefined}
	>
		{name}
	</a>;
}
