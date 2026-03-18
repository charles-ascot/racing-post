const fs = require('fs');
const content = process.argv[2];
const filePath = process.argv[3];
const decoded = Buffer.from(content, 'base64').toString('utf-8');
fs.writeFileSync(filePath, decoded);
