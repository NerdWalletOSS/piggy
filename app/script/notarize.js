const { notarize } = require('electron-notarize');
const path = require('path');
const {
  build: { appId },
} = require('../package.json');

module.exports = async (context) => {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.warn('You can build MacOS .app only on MacOS.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  if (appPath.includes('/dist/win')) {
    console.warn(`skipping notarization for ${appPath}`);
    return;
  }

  const {
    APPLE_API_KEY: appleApiKey,
    APPLE_API_KEY_ID: appleApiKeyId,
    APPLE_API_ISSUER: appleApiIssuer,
  } = process.env;

  if (!appleApiKey || !appleApiKeyId || !appleApiIssuer) {
    console.warn('skipping notarization, required credentials not found');
    return;
  }

  try {
    console.warn(`Notarizing ${appId} (${appPath})`);
    await notarize({
      tool: 'notarytool',
      appBundleId: appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleApiKey,
      appleApiKeyId,
      appleApiIssuer,
    });
    console.log(`Done notarizing ${appId}`);
  } catch (error) {
    console.error(error);
  }
};
