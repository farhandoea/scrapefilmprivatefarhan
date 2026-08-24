const fs = require('fs');
let dataPage = fs.readFileSync('app/data-historis-semua/page.tsx', 'utf8');
dataPage = dataPage.replace(
  /const sourceInfo = SOURCE_INFO\[item.category\] \|\| null;/g,
  'const sourceInfo = item.category ? SOURCE_INFO[item.category] : null;'
);
fs.writeFileSync('app/data-historis-semua/page.tsx', dataPage);
console.log('Fixed');
