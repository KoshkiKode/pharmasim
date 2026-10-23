// Jest environment setup for the desktop RN shell.
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-safe-area-context', () => {
  const m = require('react-native-safe-area-context/jest/mock');
  // v5 ships the mock as an ES default export — unwrap it for CJS consumers.
  return m.default ?? m;
});
// @react-navigation/stack fires a post-transition timer that touches
// Animated after the Jest env is torn down and crashes the process.
jest.useFakeTimers();
