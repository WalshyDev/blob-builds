---
title: Update project release channel
description: How to update a project release channel.
sidebar:
  order: 4
---

`PATCH https://blob.build/api/projects/:projectName/:releaseChannel`

## Schema

```json
{
	"name": string?,
	"supportedVersions": string?,
	"dependencies": string[]?,
	"fileNaming": string?
}
```

## Example

```sh
$ curl -X PATCH https://blob.build/api/projects/:projectName/:releaseChannel \
	-H "Authorization: Bearer $API_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "My Project",
		"supportedVersions": "1.20+",
		"dependencies": ["Slimefun", "Paper"],
		"fileNaming": "$project.jar"
	}'
```
