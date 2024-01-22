/* eslint-disable prettier/prettier */
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { stdout } = process;
const messages = {
  exist: 'Directory is already exist\n',
  empty: 'Directory is already exist, but is empty=(\nCopy files...\n',
  create: 'Create dir...\n',
  copy: 'Copy files...\n',
  check: 'Check state of directory...\n',
  update: 'Missing ',
  nothing: 'Folder already copied and up to date\nNothing to copy=)',
  missing: 'Directory is missing=(\n',
  done: 'Copied ',
  updateState: 'Update folder state...',
};
const folderPath = { source: 'files', dest: 'files-copy' };

const generateMessage = (part, len) =>
  `${part}${len} ${len > 1 ? 'files' : 'file'}\n`;

const makePath = (...args) => path.join(...args);
const mkDir = (dest) =>
  fsPromises.mkdir(makePath(__dirname, dest), fs.constants.F_OK, () => {
    throw new Error(messages.exist);
  });
const checkDir = (dir) =>
  fsPromises.readdir(dir, {
    withFileTypes: true,
  });
const copyFiles = (array) =>
  array.forEach((file) => {
    const source = makePath(__dirname, folderPath.source, file);
    const dest = makePath(__dirname, folderPath.dest, file);
    fsPromises.copyFile(source, dest, fs.constants.COPYFILE_FICLONE);
  });
const checkState = async (source, dest) => {
  const stateOfSource = await checkDir(makePath(__dirname, source)).then(
    (resolve) => resolve.map((el) => el.name),
  );
  const stateOfDest = await checkDir(makePath(__dirname, dest)).then(
    (resolve) => resolve.map((el) => el.name),
  );
  return [stateOfSource, stateOfDest];
};
const updateState = (arr) => {
  if (arr[0].length > arr[1].length) {
    return {
      array: arr[0].filter((file) => !arr[1].includes(file)),
      flag: true,
    };
  } else if (arr[1].length > arr[0].length) {
    return {
      array: arr[1].filter((file) => !arr[0].includes(file)),
      flag: false,
    };
  } else {
    return { array: null, flag: null };
  }
};
const remove = (path) =>
  fsPromises.rm(path, {
    recursive: true,
    force: true,
  });

fsPromises
  .access(makePath(__dirname, folderPath.dest))
  .then(() => {
    checkDir(makePath(__dirname, folderPath.dest)).then(() => {
      stdout.write(messages.exist);
      stdout.write(messages.check);
      checkState(folderPath.source, folderPath.dest).then((resolve) => {
        const { array, flag } = updateState(resolve);
        if (flag) {
          stdout.write(generateMessage(messages.update, array.length));
          copyFiles(array);
          stdout.write(generateMessage(messages.done, array.length));
        } else if (array && !flag) {
          const len = resolve[1].length - resolve[0].length;
          stdout.write(generateMessage(messages.updateState, len));
          array.forEach((file) =>
            remove(makePath(__dirname, folderPath.dest, file)),
          );
        } else {
          remove(makePath(__dirname, folderPath.dest)).then(() => {
            mkDir(folderPath.dest);
            checkState(folderPath.source, folderPath.dest).then((resolve) => {
              copyFiles(resolve[0]);
            });
          });
          stdout.write(messages.nothing);
        }
      });
    });
  })
  .catch(() => {
    stdout.write(messages.missing);
    stdout.write(messages.create);
    mkDir(folderPath.dest);
    stdout.write(messages.copy);
    checkState(folderPath.source, folderPath.dest).then((resolve) => {
      copyFiles(resolve[0]);
      stdout.write(generateMessage(messages.done, resolve[0].length));
    });
  });
