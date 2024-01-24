const path = require('path');
const fsPromises = require('fs/promises');

//helper functions
const makePath = (...args) => path.join(...args);
const removeContent = async (dest) =>
  await fsPromises.rm(dest, { recursive: true, force: true });
const createDir = async (dest) =>
  await fsPromises.mkdir(dest, { recursive: true });
const readFile = async (file, dir = '') => {
  const source = makePath(__dirname, dir, file);
  const body = await fsPromises.readFile(source);
  return body;
};
const readDir = async (dir, ext) => {
  const sourceDir = makePath(ext ? __dirname : '', dir);
  const files = await fsPromises.readdir(sourceDir, { withFileTypes: true });
  return ext ? files.filter((el) => el.name.slice(-ext.length) === ext) : files;
};
const makeContent = async (dir, ext) => {
  const chunks = await readDir(dir, ext);
  const body = chunks.map(async (promise) => {
    const data = await readFile(promise.name, 'styles');
    return data;
  });
  return body.map(async (el) => await el);
};

const makeHtml = (sourceFile, sourceDir, destDir, destFile) => {
  let content = '';
  readFile(sourceFile).then((resolve) => {
    content = resolve.toString();
    readDir(sourceDir, '.html').then((resolve) => {
      let files = resolve.filter((file) => file.isFile());
      if (!files.length) {
        fsPromises
          .open(makePath(__dirname, destDir, destFile), 'a+')
          .then((resolve) => resolve.appendFile(content));
      } else {
        files.forEach((file) =>
          readFile(file.name, 'components').then((resolve) => {
            let len = file.name.length - 5;
            let name = file.name.slice(0, len);
            let pattern = `{{${name}}}`;
            content = content.replaceAll(pattern, resolve.toString().trim());
            fsPromises
              .open(makePath(__dirname, 'project-dist', 'index.html'), 'w')
              .then((resolve) => resolve.appendFile(content));
          }),
        );
      }
    });
  });
};

const createStyles = (destDir, destFile) =>
  fsPromises
    .open(makePath(__dirname, destDir, destFile), 'a+')
    .then(
      async (resolve) =>
        await resolve.appendFile(await makeContent('styles', '.css')),
    );

const copyAssets = async (
  from = makePath(__dirname, 'assets'),
  copyTo = makePath(__dirname, 'project-dist', 'assets'),
) => {
  await removeContent(copyTo);
  await createDir(copyTo);
  const files = await readDir(from);
  files.forEach((file) => {
    const source = makePath(from, file.name);
    const target = makePath(copyTo, file.name);
    if (file.isFile()) {
      fsPromises.copyFile(source, target);
    } else if (file.isDirectory()) {
      createDir(target);
      copyAssets(source, target);
    }
  });
};

createDir(makePath(__dirname, 'project-dist'));
copyAssets();
createStyles('project-dist', 'style.css');
makeHtml('template.html', 'components', 'project-dist', 'index.html');
