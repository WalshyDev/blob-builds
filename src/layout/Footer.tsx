import GitHub from '~/components/icons/GitHub';
import Twitter from '~/components/icons/Twitter';

export default function Footer() {
	return (
		<div className='grid grid-cols-2 bg-heading p-4 mt-12'>
			<div className='text-center'>
				© 2023 Daniel Walsh - All rights reserved.
			</div>
			<div>
				<a href="https://twitter.com/WalshyDev"><Twitter /> @WalshyDev</a>
				<a href="https://github.com/WalshyDev" className='px-6'><GitHub /> @WalshyDev</a>
			</div>
		</div>
	);
}
