import js from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // ✅ Add Node.js globals
      },
    },
    settings: {
      react: {
        version: 'detect', // ✅ Auto-detect React version
      },
    },
  },
  pluginReact.configs.flat.recommended,
]);
