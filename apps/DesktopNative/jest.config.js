module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // deps ship untranspiled ESM — jest must babel-transform them
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-paper|react-native-safe-area-context|react-native-vector-icons|react-native-gesture-handler)/)',
  ],
};
