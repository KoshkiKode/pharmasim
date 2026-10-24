const path = require('path');

// This app pins its own react-native (0.83.x, matching react-native-macos)
// while apps/mobile keeps a newer copy hoisted at the repo root. Hoisted deps
// (react-native-paper, react-navigation, ...) would load that root copy, so map
// every react-native import to this app's copy, as Metro's nodeModulesPaths does.
const reactNativeDir = path.dirname(
  require.resolve('react-native/package.json'),
);

module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^react$': '<rootDir>/../../node_modules/react',
    '^react/(.*)$': '<rootDir>/../../node_modules/react/$1',
    '^react-native$': reactNativeDir,
    '^react-native/(.*)$': `${reactNativeDir}/$1`,
  },
  // deps ship untranspiled ESM — jest must babel-transform them
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-paper|react-native-safe-area-context|react-native-vector-icons|react-native-gesture-handler)/)',
  ],
};
