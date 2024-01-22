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
const copyFiles = (arr) =>
  arr.forEach((file) => {
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
  return stateOfSource.filter((el) => !stateOfDest.includes(el));
};

fsPromises
  .access(makePath(__dirname, folderPath.dest))
  .then(() => {
    checkDir(makePath(__dirname, folderPath.dest)).then(() => {
      stdout.write(messages.exist);
      stdout.write(messages.check);
      checkState(folderPath.source, folderPath.dest).then((resolve) => {
        if (resolve.length) {
          stdout.write(generateMessage(messages.update, resolve.length));
          copyFiles(resolve);
          stdout.write(generateMessage(messages.done, resolve.length));
        } else {
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
      copyFiles(resolve);
      stdout.write(generateMessage(messages.done, resolve.length));
    });
  });
