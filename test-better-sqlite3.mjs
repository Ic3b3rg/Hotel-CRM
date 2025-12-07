import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const db = require('better-sqlite3');
console.log('better-sqlite3 type:', typeof db);
console.log('Success!');
process.exit(0);
