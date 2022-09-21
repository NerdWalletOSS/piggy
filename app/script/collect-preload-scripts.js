const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

console.log('\n\ncollecting preload scripts and generating manifest...\n\n');

const preloadsModuleFn = path.join(
  __dirname,
  '..',
  'src/App/Plugins/preloads.js'
);

const outDir = path.join(__dirname, '..', 'public');
const outManifestFn = path.normalize(`${outDir}/preload-manifest.js`);

const MANIFEST_TEMPLATE = `/* this is an automatically generated file, DO NOT MODIFY! */
exports.default = [{{MODULES}}];`;

/* eslint-disable-next-line import/no-dynamic-require */
const preloadFilenames = require(preloadsModuleFn).default();
const outputFilenames = new Set([]);

console.log(preloadsModuleFn, preloadFilenames);

const rmFile = (fn) => {
  if (fs.existsSync(fn)) {
    try {
      fs.rmSync(fn);
    } catch (e) { /* ignore */ }
    try {
      fs.unlinkSync(fn);
    } catch (e) { /* ignore */ }
  }
};

const copyFile = (inFn) => {
  const hash = crypto
    .createHash('sha256')
    .update(inFn)
    .digest('hex')
    .toString();
  const leaf = `preload-module-${hash}.js`;
  const outFn = path.normalize(`${outDir}/${leaf}`);
  rmFile(outFn);
  outputFilenames.add(`'./${leaf}'`);
  fs.copyFileSync(inFn, outFn);
};

for (let i = 0; i < preloadFilenames.length; i++) {
  copyFile(preloadFilenames[i]);
}

const manifestEntries = Array.from(outputFilenames).join(', ');
const manifestDocument = MANIFEST_TEMPLATE.replace(
  '{{MODULES}}',
  manifestEntries
);
rmFile(outManifestFn);
fs.writeFileSync(outManifestFn, manifestDocument);

console.log(
  `\n\nwrote manifest to ${outManifestFn} with scripts: ${manifestEntries}\n\n`
);
