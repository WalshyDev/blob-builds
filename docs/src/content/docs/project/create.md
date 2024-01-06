---
title: Create project
description: How to create a project.
sidebar:
  order: 2
---

`POST https://blob.build/api/projects/:projectName/new`

## Schema

```json
{
	"name": string,
	"description": string,
	"repoLink": string?,
	"releaseChannels": [
		{
			"name": string,
			"supportedVersions": string,
			"dependencies": string[]?,
			"fileNaming": string?, // Defaults to "$project.jar"
		},
		...?,
	],
}
```

## Example

```sh
$ curl -X POST https://blob.build/api/projects/:projectName/new \
	-H "Authorization: Bearer $API_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "My Project",
		"description": "My cool project",
		"repoLink": "https://github.com/Example/MyProject",
		"releaseChannels": [
			{
				"name": "Dev",
				"supportedVersions": "1.20+",
				"dependencies": ["MyOtherProject"],
				"fileNaming": "$project.jar"
			}
		]
	}'
```
