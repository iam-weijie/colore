module.exports = {
  projects: [
    {
      displayName: 'expo',
      preset: 'jest-expo',
      testMatch: ['<rootDir>**/*.expo.test.ts']
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>**/*.node.test.js']
    }
  ],
}; 