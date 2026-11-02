module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, es2022: true },
  overrides: [
    { files: ['*.spec.ts'], env: { jasmine: true } },
    { files: ['e2e/**/*.ts', 'playwright.config.ts'], env: { node: true } },
  ],
};
