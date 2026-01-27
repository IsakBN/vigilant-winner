/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/specs/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    [
      'jest-junit',
      {
        outputDirectory: './artifacts',
        outputName: 'junit.xml',
      },
    ],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testEnvironmentOptions: {
    launchApp: false,
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
      },
    ],
  },
  verbose: true,
  bail: false,
  setupFilesAfterEnv: ['<rootDir>/helpers/setup.ts'],
}
