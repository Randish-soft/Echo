import js from '@eslint/js';
import react from 'eslint-plugin-react';
import typescript from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
    {
        files: ['**/*.{js,jsx,ts,tsx}'],

        // Ignore folders like node_modules and dist
        ignores: ['node_modules/**', 'dist/**'],

        // Language Options
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            // Define browser-specific globals
            globals: {
                window: 'readonly',
                URLSearchParams: 'readonly',
                document: 'readonly',
                HTMLElement: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                alert: 'readonly',
                fetch: 'readonly',
                atob: 'readonly',
            },


        },

        // Recommended rules and overrides
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...typescript.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
        },

        // Enable React and TypeScript plugins
        plugins: {
            react,
            '@typescript-eslint': typescript,
        },

        // React version detection
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // Prettier integration
    prettier,
];
