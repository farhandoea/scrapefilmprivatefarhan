const fs = require('fs');

function fixFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes('Object.values(catHistory)')) {
     code = code.replace(/Object\.values\(catHistory\)\.forEach\(\(item: any\) => \{/g, 
        `Object.entries(catHistory).forEach(([key, item]: [string, any]) => {
          if (key === '_updated') return;
        `);
     fs.writeFileSync(path, code);
     console.log('Fixed', path);
  }
}

fixFile('app/data-historis-semua/page.tsx');
fixFile('app/now/page.tsx');

