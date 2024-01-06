---
title: Get project
description: How to list all Blob Builds projects.
sidebar:
  order: 1
---

`GET /api/projects/:projectName`

## Schema

```json
{
	"name": string,
	"description": string,
	"repoLink": string?,
}
```

## Example

```sh
$ curl -X GET https://blob.build/api/projects/Slimefun4 \
	-H "Content-Type: application/json"
```
```
{
	"success": true,
	"message": "Success",
	"data": {
		"name": "Slimefun4",
		"description": "A new project",
		"repoLink": "https://github.com/Slimefun/Slimefun4"
	}
}
```
