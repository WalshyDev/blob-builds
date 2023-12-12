---
title: Upload
description: Documentation around uploading files.
---

**Auth is required**

To upload a file, you will need to send a `POST` to `https://blob.build/api/projects/:projectName/:releaseChannel/upload` as a form with the following fields:
* `file` - The file to upload, this will need to be a jar file
* `metadata` - A JSON string containing the metadata for the file

## Metadata schema

```json
{
	"checksum": string,
	"supportedVersions": string?,
	"dependencies": string[]?,
	"releaseNotes": string?,
	"commitHash": string?
}
```

## Example

```sh
$ curl https://blob.build/api/projects/:projectName/:releaseChannel/upload \
	-H "Authorization: Bearer $API_TOKEN" \
	--form "file=@/path/to/file.jar" \
	--form "metadata='{\"checksum\": \"<FILE_HASH>\", \"commitHash\": \"0c699ee5b57711521178da663bcf526cc5bff3b4\"}'"
```
