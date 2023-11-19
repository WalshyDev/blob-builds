import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import highlightStyles from 'highlight.js/styles/monokai-sublime.css';
import Layout from '~/layout/Layout';
import styles from './tailwind.css';
import type { LinksFunction } from '@remix-run/cloudflare';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: styles },
	{ rel: 'stylesheet', href: highlightStyles },
];

export default function App() {
	return (
		<html lang='en'>
			<head>
				<title>Blob Builds</title>
				<meta name='description' content='Builds builds builds!' />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width,initial-scale=1' />
				<Meta />
				<Links />
			</head>
			<body className='w-full h-full bg-primary-bg text-slate-100'>
				<Layout>
					<Outlet />
				</Layout>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
