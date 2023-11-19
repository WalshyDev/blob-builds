interface Props {
	latest?: boolean;
	downloadLink: string;
}

export function DownloadButton({ latest, downloadLink }: Props) {
	return <a href={downloadLink} target='_target' className="bg-blue-600 hover:bg-blue-700 p-3">
		{latest ? 'Download latest build' : 'Download build'}
	</a>;
}
