const fs = require('fs');
let dataPage = fs.readFileSync('app/data-historis-semua/page.tsx', 'utf8');
dataPage = dataPage.replace(
  /item\.category\.toLowerCase\(\)/g,
  'item.category?.toLowerCase()'
);
fs.writeFileSync('app/data-historis-semua/page.tsx', dataPage);
console.log('Fixed');
