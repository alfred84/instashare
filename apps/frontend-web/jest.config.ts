export default {
  displayName: 'frontend-web',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/frontend-web',
  collectCoverageFrom: [
    '<rootDir>/src/app/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/test-setup.ts',
    '!<rootDir>/src/main.ts',
    // Exclude legacy directories kept temporarily during migration
    '!<rootDir>/src/app/components/**/*.ts',
    '!<rootDir>/src/app/services/**/*.ts',
    '!<rootDir>/src/app/guards/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
