/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                |                                       |      *
 *    __|  |   |  __ \    _ \   __|  __ \   |   |  __ \   |  /   *
 *   (     |   |  |   |   __/  |     |   |  |   |  |   |    <    *
 *  \___| \__, | _.__/  \___| _|     .__/  \__,_| _|  _| _|\_\   *
 *        ____/                     _|                           *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// eslint-disable quote-props
module.exports = {
  root: true,
  env: {
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:unicorn/recommended',
    'plugin:json/recommended',
    'plugin:security/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true,
      modules: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-native',
    '@react-native-community',
    'jest',
    'header',
    'import',
    'unicorn',
    'prettier',
    'security',
  ],
  rules: {
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/prefer-add-event-listener': 'off',
    'unicorn/no-null': 'off',
    'unicorn/numeric-separators-style': [
      'error',
      { onlyIfContainsSeparator: true },
    ],
    'unicorn/no-console-spaces': 'off',
    'unicorn-prefer-number-properties': 'off',
    'unicorn/prefer-number-properties': 'off',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          pascalCase: true,
          camelCase: true,
        },
      },
    ],
    'unicorn/no-lonely-if': 'off',
    'linebreak-style': ['error', 'unix'],
    quotes: 'off',
    semi: 'off',
    'react/prop-types': 0,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-implicit-any-catch': ['error'],
    'react-native/no-inline-styles': 0,
    indent: 'off',
    '@typescript-eslint/indent': 'off',

    'header/header': [0, 'eslintrc.header.js'],
    '@typescript-eslint/lines-between-class-members': 1,

    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',

    'brace-style': 'off',
    '@typescript-eslint/brace-style': 'off',

    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'typeLike',
        format: ['PascalCase'],
        filter: {
          regex: '^(__String|[A-Za-z]+_[A-Za-z]+)$',
          match: false,
        },
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: { regex: '^I[A-Z]', match: false },
        filter: {
          regex: '^I(Arguments|TextWriter|O([A-Z][a-z]+[A-Za-z]*)?)$',
          match: false,
        },
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        filter: {
          regex: '^(_{1,2}filename|_{1,2}dirname|_+|[A-Za-z]+_[A-Za-z]+)$',
          match: false,
        },
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
        filter: { regex: '^[A-Za-z]+_[A-Za-z]+$', match: false },
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        filter: { regex: '^(_+|[A-Za-z]+_[A-Z][a-z]+)$', match: false },
      },
      {
        selector: 'method',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
        filter: { regex: '^[A-Za-z]+_[A-Za-z]+$', match: false },
      },
      {
        selector: 'memberLike',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        filter: { regex: '^[A-Za-z]+_[A-Za-z]+$', match: false },
      },
      {
        selector: 'enumMember',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
        filter: { regex: '^[A-Za-z]+_[A-Za-z]+$', match: false },
      },
      { selector: 'property', format: null },
    ],

    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      { assertionStyle: 'as' },
    ],

    'no-duplicate-imports': 'off',
    '@typescript-eslint/no-duplicate-imports': 'error',

    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-this-alias': 'error',

    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowTernary: true },
    ],

    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',

    '@typescript-eslint/quotes': [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: false },
    ],

    '@typescript-eslint/semi': 'error',

    'space-before-function-paren': 'off',
    '@typescript-eslint/space-before-function-paren': [
      'error',
      {
        asyncArrow: 'always',
        anonymous: 'always',
        named: 'never',
      },
    ],

    '@typescript-eslint/triple-slash-reference': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',

    'constructor-super': 'error',
    curly: ['error', 'multi-line'],
    'dot-notation': 'error',
    eqeqeq: 'error',
    'new-parens': 'error',
    'no-caller': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-eval': 'error',
    'no-extra-bind': 'error',
    'no-fallthrough': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-return-await': 'error',
    'no-restricted-globals': [
      'error',
      { name: 'setTimeout' },
      { name: 'clearTimeout' },
      { name: 'setInterval' },
      { name: 'clearInterval' },
      { name: 'setImmediate' },
      { name: 'clearImmediate' },
    ],
    'no-sparse-arrays': 'error',
    'no-template-curly-in-string': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-unsafe-finally': 'error',
    'no-unused-labels': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-const': 'error',
    'prefer-object-spread': 'error',
    'quote-props': ['error', 'consistent-as-needed'],
    'space-in-parens': 'error',
    'unicode-bom': ['error', 'never'],
    'use-isnan': 'error',
  },
  ignorePatterns: ['node_modules/**', '**__tests/**'],
  settings: {
    react: {
      version: '17',
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        'import/no-unresolved': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        'no-unused-vars': 'off',
      },
    },
    {
      files: [
        '*.{spec,test}.{js,ts,tsx}',
        '**/__{mocks,tests}__/**/*.{js,ts,tsx}',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
