/* eslint-disable prettier/prettier */
const path = require('path');
const fsPromises = require('fs/promises');
const names = {
  templatePage: 'template.html',
  assetsDir: 'assets',
  stylesDir: 'styles',
  resultStyle: 'style.css',
  mainPage: 'index.html',
  projectDir: 'project-dist',
  componentsDir: 'components',
  pageExt: '.html',
  styleExt: '.css',
  writeFlag: 'w',
  appendFlag: 'a+',
};
const {
  templatePage,
  assetsDir,
  stylesDir,
  resultStyle,
  mainPage,
  projectDir,
  componentsDir,
  pageExt,
  styleExt,
  writeFlag,
  appendFlag,
} = names;
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
  const body = chunks.map(async (file) => {
    const data = await readFile(file.name, stylesDir);
    return data;
  });
  return body.map(async (el) => await el);
};

const makeHtml = async (sourceFile, sourceDir, destDir, destFile) => {
  let content = (await readFile(sourceFile)).toString();
  const sourceHtml = await readDir(sourceDir, pageExt);
  const files = sourceHtml.filter((file) => file.isFile());
  if (!files.length) {
    const index = await fsPromises.open(
      makePath(__dirname, destDir, destFile),
      appendFlag,
    );
    index.appendFile(content);
  } else {
    files.forEach(async (file) => {
      let body = await readFile(file.name, componentsDir);
      const len = file.name.length - 5;
      const name = file.name.slice(0, len);
      const pattern = `{{${name}}}`;
      content = content.replaceAll(pattern, body.toString().trim());
      const handle = await fsPromises.open(
        makePath(__dirname, projectDir, mainPage),
        writeFlag,
      );
      handle.appendFile(content);
    });
  }
};
const createStyle = async (destDir, destFile) => {
  const bundle = await makeContent(stylesDir, styleExt);
  const handle = await fsPromises.open(
    makePath(__dirname, destDir, destFile),
    'a+',
  );
  handle.appendFile(bundle);
};
const copyAssets = async (
  from = makePath(__dirname, assetsDir),
  copyTo = makePath(__dirname, projectDir, assetsDir),
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

createDir(makePath(__dirname, projectDir));
copyAssets();
createStyle(projectDir, resultStyle);
makeHtml(templatePage, componentsDir, projectDir, mainPage);
