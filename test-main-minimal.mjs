import { app } from 'electron';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const BetterSqlite3 = require('better-sqlite3');

console.log('App:', typeof app);
console.log('Path:', typeof path);
console.log('BetterSqlite3:', typeof BetterSqlite3);
console.log('Success!');

process.exit(0);
