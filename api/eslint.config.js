import { node } from '@app/eslint-config/node';

export default [
  { ignores: ['dist/**', 'drizzle/**'] },
  ...node,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['*.config.js', 'eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
