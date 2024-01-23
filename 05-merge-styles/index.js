/* eslint-disable prettier/prettier */
const fsPromises = require('fs/promises');
const path = require('path');

const folderPath = { source: 'styles', destination: 'project-dist' };

const makePath = (...args) => path.join(...args);
const readFile = async (file) => {
  const source = makePath(__dirname, folderPath.source, file);
  const body = await fsPromises.readFile(source);
  return body;
};
const readDir = async (dir) => {
  const sourceDir = makePath(__dirname, dir);
  const files = await fsPromises.readdir(sourceDir);
  return files.filter(el => el.slice(-3) === 'css');
};
const makeContent = async () => {
  const chunks = await readDir(folderPath.source);
  const body = chunks.map(async (promise) => {
    const data = await readFile(promise);
    return data;
  });
  return body.map(async (el) => await el);
};

const destFile = makePath(__dirname, folderPath.destination, 'bundle.css');
fsPromises
  .open(destFile, 'a+')
  .then(async (resolve) => await resolve.appendFile(await makeContent()));
