import fs from 'fs';
import path from 'path';

const envContent = [
    'DB_HOST=tramway.proxy.rlwy.net',
    'DB_USER=root',
    'DB_PASSWORD=FHPKFiFywdTGBBVKCeSZsxmuIBRaiIJv',
    'DB_NAME=railway',
    'DB_PORT=19641',
    'PORT=5000',
    'SESSION_SECRET=burger_secret_key_123',
    'EMAIL_USER=82230392@students.liu.edu.lb',
    'EMAIL_PASS=nznaygvokpeqtmzo',
    'FRONTEND_URL=http://localhost:3000'
].join('\n');

fs.writeFileSync('.env', envContent, 'utf8');
console.log('✅ Clean .env written with Node.js fs');
