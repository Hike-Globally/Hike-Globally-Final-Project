import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescriptConfig from 'eslint-config-next/typescript'

/**
 * Flat config, using eslint-config-next's flat exports directly.
 *
 * (The legacy `FlatCompat` route throws "Converting circular structure to JSON" with eslint 9 +
 * eslint-config-next 16, so the compat layer is not used here.)
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescriptConfig,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'public/media/**',
      // Design-preview harness (preview/trip-page): its own Next app, with its own
      // generated .next output. Not shipped.
      'preview/**',
      // Generated files — never linted.
      'src/app/(payload)/admin/importMap.js',
      'src/payload-types.ts',
      'src/migrations/**',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    },
  },
]

export default eslintConfig
