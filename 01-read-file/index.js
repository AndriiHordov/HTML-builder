/* eslint-disable prettier/prettier */
const fs = require('fs');
const path = require('path');
const stream = fs.createReadStream(path.join(__dirname, 'text.txt'), 'utf-8');
stream.on('data', (data) => console.log(data));
stream.on('error', (err) => {
  throw err;
});
stream.on('end', () => stream.close(() => console.log('End of file reading. Bye!')));
