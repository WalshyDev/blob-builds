---
title: Errors
description: A list of errors that can be returned from the API.
---

## Error format

Errors are returned from the API in the following format:
```json
{
	"success": false,
	"error": string, // A message explaining the error
	"code": number, // An error code (see below for a list of codes)
}
```

If you want to act based on a specific error, you should rely on the code rather than the message. The message is not considered stable and may change at any time.

## Error codes

## Error Codes and Descriptions

| Code | Description                                   |
|------|-----------------------------------------------|
| 0    | An internal error occurred                    |
| 1    | Route not found                               |
| 2    | Admin only                                    |
| 1000 | There's a required field missing in your JSON |
| 1002 | Invalid json was sent                         |
| 1004 | There was something wrong with the upload     |
| 1005 | There was nothing to update                   |
| 2000 | Invalid authorization header                  |
| 2001 | Invalid API token                             |
| 4000 | Project not found                             |
| 4001 | A project with that name already exists       |
| 5000 | Release channel not found                     |
| 6000 | Build not found                               |
| 6001 | Invalid build ID                              |
