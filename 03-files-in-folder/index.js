const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { stdout } = process;
const folderPath = path.join(__dirname, 'secret-folder');
const ONE_KB = 1024;
const viewer = (name, ext, size) =>
  stdout.write(`${name} - ${ext} - ${size ? `${size}kb` : size} \n`);
fsPromises
  .readdir(folderPath, {
    withFileTypes: true,
  })
  .then((resolve) => {
    resolve.forEach((file) =>
      fs.stat(path.join(folderPath, file.name), (err, stats) => {
        if (err) {
          throw err;
        }
        if (!file.isDirectory()) {
          const dotIndex = file.name.indexOf('.');
          const name = file.name.slice(0, dotIndex);
          const ext = file.name.slice(dotIndex + 1);
          const sizeInKB = (+stats['size'] / ONE_KB).toFixed(3);
          viewer(name, ext, sizeInKB);
        }
      }),
    );
  });
