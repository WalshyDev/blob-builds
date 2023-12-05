const navigation = [
	{ name: 'Projects', href: '/' },
	{ name: 'Developers', href: '/developers' },
];

export default function NavBar() {
	return (
		<nav className="flex bg-heading items-center justify-between p-6 lg:px-8 mb-12" aria-label="Global">
			<div className="hidden md:flex lg:flex-1">
				<a href="/" className="-m-1.5 p-1.5">
					<span>Blob Builds</span>
				</a>
			</div>
			<div className="flex gap-x-12">
				{navigation.map((item) => (
					<a key={item.name} href={item.href} className="text-md font-semibold leading-6
						ease-in-out duration-300 hover:text-slate-500"
					>
						{item.name}
					</a>
				))}
			</div>
			<div className="lg:flex lg:flex-1 lg:justify-end">
				<a href="/login" className="text-md font-semibold leading-6 ease-in-out duration-300 hover:text-slate-500">
					Log in <span aria-hidden="true">&rarr;</span>
				</a>
			</div>
		</nav>
	);
}
