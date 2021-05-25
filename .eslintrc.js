module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:unicorn/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
      modules: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-native',
    'jest',
    'header',
    'import',
    'unicorn',
    'prettier'
  ],
  rules: {
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'react/prop-types': 0,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-implicit-any-catch': ['error'],
    'react-native/no-inline-styles': 0,
    'no-console': 1,
    'indent': ['error', 2],
    '@typescript-eslint/member-ordering': [
      1,
      {
        default: {
          memberTypes: ['signature', 'method', 'constructor', 'field'],
          order: 'alphabetically',
        },
      },
    ],
    'ordered-imports': [
      1,
      {
        'import-sources-order': 'lowercase-last',
        'named-imports-order': 'lowercase-first',
      },
    ],
    'header/header': [1, './eslintrc.header.js'],
    '@typescript-eslint/lines-between-class-members': 1,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react/jsx-filename-extension': [
      1,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',

    'brace-style': 'off',
    '@typescript-eslint/brace-style': [
      'error',
      'stroustrup',
      { allowSingleLine: true },
    ],

    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'typeLike',
        format: ['PascalCase'],
        filter: { regex: '^(__String|[A-Za-z]+_[A-Za-z]+)$', match: false },
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

    // scripts/eslint/rules
    // 'object-literal-surrounding-space': 'error',
    // 'no-type-assertion-whitespace': 'error',
    //'type-operator-spacing': 'error',
    /*'only-arrow-functions': [
      'error',
      {
        allowNamedFunctions: true,
        allowDeclarations: true,
      },
    ],*/
    // 'no-double-space': 'error',
    // 'boolean-trivia': 'error',
    /*'no-in-operator': 'error',
    'simple-indent': 'error',

    'debug-assert': 'error',
    'no-keywords': 'error',
        */
    // 'one-namespace-per-file': 'error',

    // eslint-plugin-import
    'import/no-extraneous-dependencies': [
      'error',
      { optionalDependencies: false },
    ],

    // eslint-plugin-no-null
    //'no-null/no-null': 'error',

    // eslint-plugin-jsdoc
    //'jsdoc/check-alignment': 'error',

    // eslint
    'constructor-super': 'error',
    'curly': ['error', 'multi-line'],
    'dot-notation': 'error',
    'eqeqeq': 'error',
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
  ignorePatterns: ['node_modules/**', './*.js'],
  settings: {
    'react': {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: [
        '*.{spec,test}.{js,ts,tsx}',
        '**/__{mocks,tests}__/**/*.{js,ts,tsx}',
      ],
      env: {
        jest: true,
      },
    },
    {
      files: ['./*.{js,ts,tsx,json}'],
      rules: {
        'header/header': 'off',
      },
    },
  ],
};
