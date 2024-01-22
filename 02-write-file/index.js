/* eslint-disable prettier/prettier */
const fs = require('fs');
const path = require('path');
const { stdin, stdout } = process;
const output = fs.createWriteStream(
  path.join(__dirname, 'output.txt'),
  'utf-8',
);
stdout.write('Enter data to storing: \n');
stdin.on('data', (data) => {
  const buffer = data.toString().trim();
  if (buffer === 'exit') {
    process.exit();
  } else {
    output.write(data, 'utf-8');
  }
});
process.on('SIGINT', () => {
  process.exit();
});
process.on('exit', () => {
  output.close();
  console.log('File modified succesfull!! \nShutting down...');
});
