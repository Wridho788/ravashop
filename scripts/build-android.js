#!/usr/bin/env node
/**
 * Builds a RavaShop Android APK and copies it to build/.
 *
 *   node scripts/build-android.js debug     # needs Metro (npm start) at runtime
 *   node scripts/build-android.js release   # distribution candidate, no fault controls
 *   node scripts/build-android.js e2e       # release build with E2E fault controls (RAVASHOP_E2E=1)
 *
 * For release/e2e the JS bundle task is always re-run because Gradle does not see
 * RAVASHOP_E2E as an input, and the bundle is inspected so a release APK can never ship
 * the E2E panel.
 */
const {execFileSync} = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
if (!['debug', 'release', 'e2e'].includes(mode)) {
  console.error('Usage: node scripts/build-android.js <debug|release|e2e>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const android = path.join(root, 'android');
const abi = process.env.RAVASHOP_ABI ?? 'arm64-v8a';
const isWindows = process.platform === 'win32';

const tasks =
  mode === 'debug' ? [':app:assembleDebug'] : [':app:createBundleReleaseJsAndAssets', '--rerun', ':app:assembleRelease'];
execFileSync(
  path.join(android, isWindows ? 'gradlew.bat' : 'gradlew'),
  [...tasks, `-PreactNativeArchitectures=${abi}`, '--console=plain'],
  {
    cwd: android,
    env: {...process.env, RAVASHOP_E2E: mode === 'e2e' ? '1' : '0'},
    stdio: 'inherit',
    shell: isWindows,
  },
);

const variant = mode === 'debug' ? 'debug' : 'release';
const apkFile = path.join(android, 'app', 'build', 'outputs', 'apk', variant, `app-${variant}.apk`);
let hasPanel = null;
if (mode !== 'debug') {
  const bundle = path.join(android, 'app', 'build', 'generated', 'assets', 'react', 'release', 'index.android.bundle');
  hasPanel = fs.readFileSync(bundle).includes('e2e.fault.checkout');
  if (mode === 'release' && hasPanel) {
    console.error('ERROR: release bundle contains E2E fault controls.');
    process.exit(2);
  }
  if (mode === 'e2e' && !hasPanel) {
    console.error('ERROR: E2E bundle does not contain the fault panel; RAVASHOP_E2E was not applied.');
    process.exit(2);
  }
}

const date = new Date().toISOString().slice(0, 10);
const outDir = path.join(root, 'build');
fs.mkdirSync(outDir, {recursive: true});
const target = path.join(outDir, `RavaShop-${mode}-${abi}-${date}.apk`);
fs.copyFileSync(apkFile, target);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
console.log(`\nAPK: ${path.relative(root, target)}\nSHA-256: ${sha256}`);
if (hasPanel !== null) {
  console.log(`E2E controls: ${hasPanel ? 'yes' : 'no'}`);
}
