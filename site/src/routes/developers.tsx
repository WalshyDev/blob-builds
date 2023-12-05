import Code from '~/components/Code';
import { H1, H2, H3 } from '~/components/html/Headings';
import Link from '~/components/Link';

const ACTION =
	'https://github.com/WalshyDev/blob-builds/tree/main/gh-action';
const EXAMPLE_WORKFLOW =
	'https://github.com/Slimefun-Addon-Community/HeadLimiter/blob/master/.github/workflows/publish.yml';

export default function Developers() {
	return (
		<>
			<H1>Developers</H1>
			<p>
				Are you a developer looking to use Blob Builds for your own plugin or a host looking to use the API?
				If so, this page is for you!
			</p>

			<p className='font-bold'>Note: This page is still WIP</p>

			<H2>Submitting builds through GitHub</H2>
			<p>
				There is a GitHub Action available that allows you to easily publish new builds to Blob Builds automatically.
				You can find that here (available as <code>WalshyDev/blob-builds/gh-action</code>):{' '}
				<Link href={ACTION}>{ACTION}</Link>
				<br />

				Here is an example GitHub Workflow using that action:{' '}
				<Link href={EXAMPLE_WORKFLOW}>{EXAMPLE_WORKFLOW}</Link>
			</p>

			<H2>API reference</H2>

			<H3>New project</H3>
			<p>
				To upload a new project, you need to send a <code>POST</code> to <code>/api/projects/new</code>.
				<br />
				Here is an example:
			</p>
			<Code language='bash'>
				{
					`
$ curl https://blob.build/api/projects/new -s \\
	-X POST \\
	-H 'Authorization: Bearer <API_TOKEN>' \\
	-H 'Content-Type: application/json' \\
	-d '{"name": "NewProject", "description": "This project does some really cool stuff"}'
					`
				}
			</Code>
			<Code language='json'>
				{
					`
{
	"success": true,
	"message": "Project created!",
	"data": {
		"project": {
			"projectId": 1,
			"userId": 1,
			"name": "NewProject",
			"description": "This project does some really cool stuff"
		},
		"releaseChannels": [
			{
				"projectId": 1,
				"name": "Dev",
				"supportedVersions": "Unknown",
				"dependencies": [],
				"fileNaming": "$project.jar"
			}
		]
	}
}
					`
				}
			</Code>

			<p>
				If you want to create a project with a specific release channel, you can do so by adding the{' '}
				<code>releaseChannels</code> array, like so:
			</p>

			<Code language='bash'>
				{
					`
$ curl https://blob.build/api/projects/new -s \\
	-X POST \\
	-H 'Authorization: Bearer <API_TOKEN>' \\
	-H 'Content-Type: application/json' \\
	-d '{
		"name": "NewProject",
		"description": "This project does some really cool stuff",
		"releaseChannels": [
			{
				"name": "Dev",
				"supportedVersions": "1.20+",
				"dependencies": [],
				"fileNaming": "$project.jar"
			},
			{
				"name": "Release",
				"supportedVersions": "1.20+",
				"dependencies": [],
				"fileNaming": "$project-$releaseChannel.jar"
			}
		]
	}'
					`
				}
			</Code>
			<Code language='json'>
				{
					`
{
	"success": true,
	"message": "Project created!",
	"data": {
		"project": {
			"projectId": 1,
			"userId": 1,
			"name": "NewProject",
			"description": "This project does some really cool stuff"
		},
		"releaseChannels": [
			{
				"projectId": 1,
				"name": "Dev",
				"supportedVersions": "1.20+",
				"dependencies": [],
				"fileNaming": "$project.jar"
			},
			{
				"projectId": 1,
				"name": "Release",
				"supportedVersions": "1.20+",
				"dependencies": [],
				"fileNaming": "$project-$releaseChannel.jar"
			}
		]
	}
}
					`
				}
			</Code>
		</>
	);
}
