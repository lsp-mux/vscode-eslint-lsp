import { configure } from '@gtbuchanan/eslint-config';

export default [
  ...await configure({
    tsconfigRootDir: import.meta.dirname,
  }),
  {
    /* engines describes the published language server, which is extracted
       rather than linted. Everything linted here runs on the Node that
       .config/mise.toml pins. */
    settings: { node: { version: '>=26.13.0' } },
  },
];
