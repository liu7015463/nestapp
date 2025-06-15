/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import/no-extraneous-dependencies */
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const { defineConfig, globalIgnores } = require('eslint/config');

const jest = require('eslint-plugin-jest');
const prettier = require('eslint-plugin-prettier');
const unusedImports = require('eslint-plugin-unused-imports');
const globals = require('globals');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = defineConfig([
    {
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',

            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
            },

            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },

        plugins: {
            '@typescript-eslint': typescriptEslint,
            jest,
            prettier,
            'unused-imports': unusedImports,
        },

        extends: compat.extends(
            'airbnb-base',
            'airbnb-typescript/base',
            'plugin:@typescript-eslint/recommended',
            'plugin:@typescript-eslint/recommended-requiring-type-checking',
            'plugin:jest/recommended',
            'prettier',
            'plugin:prettier/recommended',
        ),

        rules: {
            'no-console': 0,
            'no-var-requires': 0,
            'no-restricted-syntax': 0,
            'no-continue': 0,
            'no-await-in-loop': 0,
            'no-return-await': 0,
            'no-unused-vars': 0,
            'no-multi-assign': 0,

            'no-param-reassign': [
                2,
                {
                    props: false,
                },
            ],

            'import/prefer-default-export': 0,
            'import/no-cycle': 0,
            'import/no-dynamic-require': 0,
            'max-classes-per-file': 0,
            'class-methods-use-this': 0,
            'guard-for-in': 0,
            'no-underscore-dangle': 0,
            'no-plusplus': 0,
            'no-lonely-if': 0,

            'no-bitwise': [
                'error',
                {
                    allow: ['~'],
                },
            ],

            'import/no-absolute-path': 0,
            'import/extensions': 0,
            'import/no-named-default': 0,
            'no-restricted-exports': 0,

            'import/no-extraneous-dependencies': [
                1,
                {
                    devDependencies: [
                        '**/*.test.{ts,js}',
                        '**/*.spec.{ts,js}',
                        './test/**.{ts,js}',
                        './scripts/**/*.{ts,js}',
                    ],
                },
            ],

            'import/order': [
                1,
                {
                    pathGroups: [
                        {
                            pattern: '@/**',
                            group: 'external',
                            position: 'after',
                        },
                    ],

                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: false,
                    },

                    'newlines-between': 'always-and-inside-groups',
                    warnOnUnassignedImports: true,
                },
            ],

            'unused-imports/no-unused-imports': 1,

            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'none',
                    ignoreRestSiblings: true,
                },
            ],

            '@typescript-eslint/no-unused-vars': 0,
            '@typescript-eslint/no-empty-interface': 0,
            '@typescript-eslint/no-this-alias': 0,
            '@typescript-eslint/no-var-requires': 0,
            '@typescript-eslint/no-use-before-define': 0,
            '@typescript-eslint/explicit-member-accessibility': 0,
            '@typescript-eslint/no-non-null-assertion': 0,
            '@typescript-eslint/no-unnecessary-type-assertion': 0,
            '@typescript-eslint/require-await': 0,
            '@typescript-eslint/no-for-in-array': 0,
            '@typescript-eslint/interface-name-prefix': 0,
            '@typescript-eslint/explicit-function-return-type': 0,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/explicit-module-boundary-types': 0,
            '@typescript-eslint/no-floating-promises': 0,
            '@typescript-eslint/restrict-template-expressions': 0,
            '@typescript-eslint/no-unsafe-assignment': 0,
            '@typescript-eslint/no-unsafe-return': 0,
            '@typescript-eslint/no-unused-expressions': 0,
            '@typescript-eslint/no-misused-promises': 0,
            '@typescript-eslint/no-unsafe-member-access': 0,
            '@typescript-eslint/no-unsafe-call': 0,
            '@typescript-eslint/no-unsafe-argument': 0,
            '@typescript-eslint/ban-ts-comment': 0,
            '@typescript-eslint/lines-between-class-members': 0,
            '@typescript-eslint/no-throw-literal': 0,
        },

        settings: {
            extensions: ['.ts', '.d.ts', '.cts', '.mts', '.js', '.cjs', 'mjs', '.json'],
        },
    },
    globalIgnores([
        '**/dist',
        '**/back',
        '**/node_modules',
        '**/pnpm-lock.yaml',
        '**/docker',
        '**/Dockerfile*',
        '**/LICENSE',
        '**/yarn-error.log',
        '**/.history',
        '**/.vscode',
        '**/.docusaurus',
        '**/.dockerignore',
        '**/.DS_Store',
        '**/.eslintignore',
        '**/.editorconfig',
        '**/.gitignore',
        '**/.prettierignore',
        '**/.eslintcache',
        '**/*.lock',
        '**/*.svg',
        '**/*.md',
        '**/*.ejs',
        '**/*.html',
        '**/*.png',
        '**/*.toml',
    ]),
]);
