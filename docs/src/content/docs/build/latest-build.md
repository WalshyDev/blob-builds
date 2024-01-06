---
title: Project latest build
description: How to get the latest build for a project.
sidebar:
  order: 1
---

`GET /api/builds/:projectName/:releaseChannel/latest`

## Schema

```json
{
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
```

## Example

```sh
$ curl -X GET https://blob.build/api/builds/Slimefun4/Dev/latest \
	-H "Content-Type: application/json"
```
```
{
	"success": true,
	"message": "Success",
	"data": {
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
}
```
