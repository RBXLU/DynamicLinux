// Конфигурация ESLint для проверки кода расширения (npx eslint .)
export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                global: 'readonly',
                log: 'readonly',
                logError: 'readonly',
                print: 'readonly',
                console: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
            },
        },
        rules: {
            'no-undef': 'error',
            'no-unused-vars': ['warn', {args: 'none'}],
            'no-unreachable': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-class-members': 'error',
            'no-redeclare': 'error',
            'no-const-assign': 'error',
            'no-self-assign': 'error',
            'no-mixed-operators': 'off',
        },
    },
];
