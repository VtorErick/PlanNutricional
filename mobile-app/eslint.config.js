const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'coverage/*',
      'app/+not-found.tsx',
      'components/**/*',
    ],
  },
]);
