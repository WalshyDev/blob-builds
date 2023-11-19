import hljs from 'highlight.js';
import type { PropsWithChildren } from 'react';

interface Props {
	language: string;
}

export default function Code({ language, children }: PropsWithChildren<Props>) {
	return <pre>
		<code
			className={`language-${language} overflow-scroll`}
			dangerouslySetInnerHTML={{
				__html: hljs.highlight(String(children), {
					language,
					ignoreIllegals: true,
				}).value,
			}}
		>
		</code>
	</pre>;
}
