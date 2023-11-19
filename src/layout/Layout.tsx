import NavBar from 'src/layout/NavBar';
import Footer from '~/layout/Footer';
import type { PropsWithChildren } from 'react';

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
	return (
		<>
			<NavBar />
			<main className='lg:mx-[10%]'>
				{children}
			</main>
			<Footer />
		</>
	);
};

export default Layout;
