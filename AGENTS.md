# vscode-eslint-lsp

## Versioning the vscode-eslint-lsp package

`@lsp-mux/vscode-eslint-lsp` republishes the VS Code ESLint extension's server
under the extension's own version, so its `package.json` `version` always
equals an upstream release. Renovate owns that field through the custom
manager in `.github/renovate.json`, and merging its bump is what publishes.
Leave the version to Renovate and record changes in commits and pull requests.

`.changeset/` holds only the config tooling's CD needs to reach `gtb publish`.
A changeset file would make `changeset version` bump the package off upstream,
so the hk step `forbid-changesets` rejects any `.changeset/*.md`.

## Why vscode-eslint-lsp lives outside lsp-mux

`lsp-mux/lsp-mux` versions its packages with changesets and gates pull
requests on `changeset-check`, which cannot exempt a package whose version
comes from upstream. The package moves there once
[gtbuchanan/tooling#754](https://github.com/gtbuchanan/tooling/issues/754)
adds that exemption.
