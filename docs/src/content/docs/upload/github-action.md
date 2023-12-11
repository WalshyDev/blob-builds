---
title: GitHub Action
description: Documentation around the GitHub Action.
---

There is a GitHub Action to easily push your new files to Blob Builds.

## Usage

```yaml
name: Publish build

on:
  push:
    branches:
      - main # Only publish when pushing to "main"

jobs:
  publish:
    name: Upload build
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.message, '[ci skip]') == false

    steps:
      - uses: actions/checkout@v2

      - name: Set up JDK 16
        uses: actions/setup-java@v1
        with:
          java-version: 16

      - name: Build with Maven
        run: mvn -B package

      - name: Upload to Blob Builds
        uses: WalshyDev/blob-builds/gh-action@main
        with:
          project: MyProject
          apiToken: ${{ secrets.BLOB_BUILDS_API_TOKEN }}
          file: ./target/MyProject.jar
          releaseNotes: ${{ github.event.head_commit.message }}
```

## Options

| Name             | Description                       | Required | Default                                                       |
|------------------|-----------------------------------|----------|---------------------------------------------------------------|
| `project`        | The project to upload to.         | Yes      | N/A                                                           |
| `releaseChannel` | The release channel to upload to. | No       | `Dev`                                                         |
| `apiToken`       | The API token to use.             | Yes      | N/A                                                           |
| `file`           | The file to upload.               | No       | If not supplied, we try to find it on a best effort basis[^1] |
| `releaseNotes`   | The release notes for this build. | No       | N/A                                                           |

[^1]: If there is a `pom.xml` we will try look for the `finalName` field and use that to find the jar. If this does not exist and `file` is not supplied, the action will fail.
