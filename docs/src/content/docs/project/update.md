---
title: Update project
description: How to update a project.
sidebar:
  order: 3
---

`PATCH https://blob.build/api/projects/:projectName`

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
$ curl -X PATCH https://blob.build/api/projects/:projectName \
	-H "Authorization: Bearer $API_TOKEN" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "My Project",
		"description": "My cool project",
		"repoLink": "https://github.com/Example/MyProject"
	}'
```
