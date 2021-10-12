const fs = require('fs');
const uglify = require('uglify-js');
const Browserify = require('browserify');

const inputFile = './libraries/cobrowsing/index.js';
const tempFile = './temp_cobrowsing_bundle.js';
const outDir = './dist/cobrowsing';
const outFile = `${outDir}/lib.js`;

const browserify = Browserify(inputFile, { standalone: 'sideby' });
browserify.add(inputFile);
browserify.bundle((err, src) => {
  fs.writeFileSync(tempFile, src, "binary");
  const data = fs.readFileSync(tempFile, { encoding: 'utf-8' });
  const result = uglify.minify(data);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, result.code);
  fs.unlinkSync(tempFile);
});