# check-pr-files action

This action checks if a PR contains necessary files.

## Build

``` sh
npm install
npm run build
```

## Inputs

### `files`

**Required**

A list of files to check. Default:

    zktest/src/archive/test2/config.properties
    zkdoc/release-note

Remember to use a full path.

### `token`

**Required**

A `GITHUB_TOKEN` used to add warning to the PR.

## Example usage

``` yml
uses: zkoss/check-pr-files-action@v1
with:
  files: |
    README.md
  token: ${{ secrets.GITHUB_TOKEN }}
```