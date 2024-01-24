---
title: List projects
description: How to list all Blob Builds projects.
sidebar:
  order: 0
---

`GET /api/projects`

## Schema

```json
[
	{
		"name": string,
		"owner": string,
		"releaseChannels": [
			string?,
			...?,
		],
	}
	...?,
]
```

## Example

```sh
$ curl -X GET https://blob.build/api/projects \
	-H "Content-Type: application/json"
```
```json
{
	"success": true,
	"message": "Success",
	"data": [
		{
			"name": "Slimefun4",
			"owner": "Slimefun",
			"releaseChannels": [
				"Dev",
				"RC"
			]
		}
	]
}
```
