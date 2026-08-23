const fs = require('fs');

function fixFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');
  if (code.includes('Object.values(categoryHistory)')) {
     code = code.replace(/Object\.values\(categoryHistory\)\.find\(/g, 
        `Object.entries(categoryHistory).filter(([k]) => k !== '_updated').map(([k, v]) => v).find(`);
     fs.writeFileSync(path, code);
     console.log('Fixed', path);
  }
}

fixFile('app/now/page.tsx');

