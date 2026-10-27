import js from '@eslint/js';
import vueI18n from '@intlify/eslint-plugin-vue-i18n';
import vitest from '@vitest/eslint-plugin';
import prettier from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

const SOURCE_FILES = ['**/*.{js,vue}'];

export default [
  {
    ignores: ['dist/', 'coverage/', 'node_modules/', 'public/'],
  },
  { ...js.configs.recommended, files: SOURCE_FILES },
  ...vue.configs['flat/recommended-error'],
  { ...unicorn.configs.recommended, files: SOURCE_FILES },
  // Also lints locale JSON files and YAML (e.g. workflows) with i18n-aware parsers.
  ...vueI18n.configs.recommended,
  {
    settings: {
      'vue-i18n': {
        localeDir: './src/i18n/locales/*.json',
        messageSyntaxVersion: '^11.0.0',
      },
    },
  },
  {
    files: SOURCE_FILES,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      // Core quality rules.
      complexity: ['error', 10],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'no-console': 'error',
      'no-implicit-coercion': 'error',
      'no-param-reassign': 'error',
      'no-shadow': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',

      // Vue.
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-macros-order': 'error',
      'vue/no-unused-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/require-explicit-emits': 'error',

      // i18n: every user-facing string must come from the locale files.
      '@intlify/vue-i18n/no-raw-text': 'error',
      '@intlify/vue-i18n/no-missing-keys': 'error',
      '@intlify/vue-i18n/no-unused-keys': ['error', { extensions: ['.js', '.vue'] }],

      // Unicorn tweaks for a Vue codebase.
      'unicorn/filename-case': ['error', { cases: { kebabCase: true, pascalCase: true } }],
      // Standard JSDoc blocks use leading asterisks.
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      // `null` is meaningful in persisted JSON (e.g. "no player yet") and DOM APIs.
      'unicorn/no-null': 'off',
      // Passing `undefined` explicitly is clearer in assertions about missing values.
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    },
  },
  {
    files: ['**/*.test.js', 'tests/**/*.js'],
    ...vitest.configs.recommended,
  },
  {
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
];
