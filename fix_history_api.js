const fs = require('fs');
const filePath = 'app/api/history/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

if (code.includes("typeof val === 'object' && val.movie")) {
  code = code.replace(
    /for \(const \[key, val\] of Object\.entries\(data\)\) \{/g,
    `for (const [key, val] of Object.entries(data)) {
        if (key === '_updated') continue;`
  );
  fs.writeFileSync(filePath, code);
  console.log('Fixed API route');
} else {
  console.log('API route already fixed or different format');
}
