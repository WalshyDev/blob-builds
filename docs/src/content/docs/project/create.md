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

### Powershell v7 Example

```pwsh
# Define the necessary variables
$API_TOKEN = "<API KEY HERE>"

$projectName = "MyProject"
$description = "My cool project"
$repoLink = "https://github.com/Example/MyProject"

$apiUrl = "https://blob.build/api/projects/$projectName/new"
$apiToken = "Bearer $API_TOKEN"

# Define the payload as a hashtable to convert to json
$payload = @{
    name = $projectName
    description = $description
    repoLink = $repoLink
    releaseChannels = @(
        @{
            name = "Dev"
            supportedVersions = "1.20+"
            dependencies = @("MyOtherProject")
            fileNaming = "MyProject.jar"
        }
    )
} | ConvertTo-Json -Depth 3

# Send the POST request
$response = Invoke-RestMethod -Uri $apiUrl -Method 'POST' -Headers @{
    Authorization = $apiToken
    "Content-Type" = "application/json"
} -Body $payload

# Output the response
$response
```
