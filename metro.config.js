// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force linkedom to use CJS build (ESM version has .js extension imports
// that Metro cannot resolve)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'linkedom') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/linkedom/cjs/index.js'),
      type: 'sourceFile',
    };
  }
  // Force CJS build: Metro picks up the ESM `module` field instead of `main`
  if (moduleName === '@tabler/icons-react-native') {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@tabler/icons-react-native/dist/cjs/tabler-icons-react-native.cjs'
      ),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
