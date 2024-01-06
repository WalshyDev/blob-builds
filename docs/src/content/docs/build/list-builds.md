---
title: Project builds
description: How to list all project builds.
sidebar:
  order: 0
---


`GET /api/builds/:projectName`

## Schema

```json
{
	[releaseChannel: string]: object: {
		"projectName": string,
		"releaseChannel": string,
		"buildId": number,
		"checksum": string,
		"fileDownloadUrl": string,
		"supportedVersions": string?,
		"dependencies": string[]?,
		"releaseNotes": string | null?,
		"commitHash": string | null?,
		"commitLink": string | null?,
	}
}
```

## Example

```sh
$ curl -X GET https://blob.build/api/builds/Slimefun4 \
	-H "Content-Type: application/json"
```
```
{
	"success": true,
	"message": "Success",
	"data": {
		"Dev": [
			{
				"projectName": "Slimefun4",
				"releaseChannel": "Dev",
				"buildId": 1,
				"checksum": "a4caf497ed294e18911e193af302c61570c01a88a3b9415455222e2dca50d17c",
				"fileDownloadUrl": "https://blob.build/dl/Slimefun4/Dev/1",
				"supportedVersions": "1.16+",
				"dependencies": [],
				"releaseNotes": "Example release notes",
				"commitHash": "e0c94902f8152277f01e4ada3ecba00c1ced3e31",
				"commitLink": "https://github.com/Slimefun/Slimefun4/commit/e0c94902f8152277f01e4ada3ecba00c1ced3e31"
			}
		],
		"RC": [
			{
				"projectName": "Slimefun4",
				"releaseChannel": "RC",
				"buildId": 1,
				"checksum": "d1572921d8e9dd15910c2f4b49373c24f54d44ff42ff5eadf6c1962f27b51dbb",
				"fileDownloadUrl": "https://blob.build/dl/Slimefun4/RC/1",
				"supportedVersions": "1.16+",
				"dependencies": [],
				"releaseNotes": "https://github.com/Slimefun/Slimefun4/blob/master/CHANGELOG.md#release-candidate-36-20-dec-2023",
				"commitHash": null
			}
		]
	}
}
```
