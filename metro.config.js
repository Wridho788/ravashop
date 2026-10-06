const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * RAVASHOP_E2E=1 swaps every module in src/e2e/ for its `.e2e` sibling (faults.ts ->
 * faults.e2e.ts, E2EPanel.tsx -> E2EPanel.e2e.tsx), so only the E2E build contains
 * storage fault controls. scripts/build-android.js verifies this on every release build.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const e2e = process.env.RAVASHOP_E2E === '1';
const e2eDir = path.resolve(__dirname, 'src/e2e') + path.sep;

const config = {
  cacheVersion: e2e ? 'ravashop-e2e' : 'ravashop',
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const resolution = context.resolveRequest(context, moduleName, platform);
      if (e2e && resolution.type === 'sourceFile' && resolution.filePath.startsWith(e2eDir)) {
        const {dir, name, ext} = path.parse(resolution.filePath);
        const swapped = path.join(dir, `${name}.e2e${ext}`);
        if (!name.endsWith('.e2e') && fs.existsSync(swapped)) {
          return {type: 'sourceFile', filePath: swapped};
        }
      }
      return resolution;
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
