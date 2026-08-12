import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

const rules = {
  'no-undef': 'off',
  'no-unused-vars': 'off',
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src-tauri/target/**',
      'src-tauri/gen/**',
      'public/vendor/**',
      'vendor/**',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { sourceType: 'module' },
    },
    rules,
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      globals: { ...globals.browser },
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      ...rules,
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
];
