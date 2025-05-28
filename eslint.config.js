import js from '@eslint/js';
import globals from 'globals';

import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Add Node.js globals
      },
    },

    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'getter-return': 'off',
      'no-prototype-builtins': 'off',
      'no-empty': 'off',
      'no-constant-binary-expression': 'off',
      'no-unused-private-class-members': 'off',
      'no-redeclare': 'off',
      'no-cond-assign': 'off',
      'no-useless-escape': 'off',
      'no-unreachable': 'off',
    },
  },
]);
