const { notarize } = require('electron-notarize');
const path = require('path');
const {
  build: { appId },
} = require('../package.json');

module.exports = async (context) => {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    console.error('You can build MacOS .app only on MacOS.');
    return;
  }
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  if (appPath.includes('/dist/win')) {
    console.log(`skipping notarization for ${appPath}`);
    return;
  }

  if (
    !process.env.ASC_EMAIL ||
    !process.env.ASC_PASSWORD ||
    !process.env.ASC_PROVIDER
  ) {
    console.log(
      `skipping notarization for ${appName}, required credentials not found.`
    );
    return;
  }

  console.log(`Notarizing ${appId} (${appPath})`);

  try {
    await notarize({
      appBundleId: appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.ASC_EMAIL,
      appleIdPassword: process.env.ASC_PASSWORD,
      ascProvider: process.env.ASC_PROVIDER,
    });

    console.log(`Done notarizing ${appId}`);
  } catch (error) {
    console.error(
      'Failed! Please ensure valid credentials are specified via environment variables.'
    );
  }
};
