import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import ts from 'typescript-eslint';

export default ts.config(
  {
    ignores: [
      'packages/*',
      '!**/packages/contensis-cli/**',
      '.yarn/',
      '**/dist/',
      '**/node_modules/**',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ...js.configs.recommended,
  },
  prettier,
  importPlugin.flatConfigs.typescript,
  ...ts.configs.recommended.map(config => ({
    files: ['**/*.{ts,tsx,mts}'],
    ...config,
  })),
  {
    plugins: {
      '@typescript-eslint': ts.plugin,
    },
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }
);
