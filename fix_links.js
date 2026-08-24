const fs = require('fs');

// Fix app/now/page.tsx
let nowPage = fs.readFileSync('app/now/page.tsx', 'utf8');
nowPage = nowPage.replace(
  /{listId\.includes\('netflix'\) && \(\s*<a href={`\${sourceInfo\?\.url}\?week=\${lastSeenDate}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0\.5 w-fit">\s*<span>Buka Arsip Tudum<\/span>\s*<ExternalLink className="w-2\.5 h-2\.5" \/>\s*<\/a>\s*\)}/g,
  `{sourceInfo?.url && (
                                        <a href={listId.includes('netflix') ? \`\${sourceInfo.url}?week=\${lastSeenDate}\` : sourceInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                                          <span>{listId.includes('netflix') ? \`Buka Arsip Tudum \${listId.includes('non_english') ? '(Pilih Non-English)' : ''}\` : \`Kunjungi \${sourceInfo.shortLabel}\`}</span>
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}`
);
fs.writeFileSync('app/now/page.tsx', nowPage);

// Fix app/data-historis-semua/page.tsx
let dataPage = fs.readFileSync('app/data-historis-semua/page.tsx', 'utf8');
dataPage = dataPage.replace(
  /{item\.category\.includes\('netflix'\) && sourceInfo\?\.url && \(\s*<a href={`\${sourceInfo\.url}\?week=\${lastSeenDate}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0\.5 w-fit">\s*<span>Buka Arsip Tudum<\/span>\s*<ExternalLink className="w-2\.5 h-2\.5" \/>\s*<\/a>\s*\)}/g,
  `{sourceInfo?.url && (
                              <a href={(item.platform?.includes('netflix') || item.category.toLowerCase().includes('netflix')) ? \`\${sourceInfo.url}?week=\${lastSeenDate}\` : sourceInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                                <span>{(item.platform?.includes('netflix') || item.category.toLowerCase().includes('netflix')) ? \`Buka Arsip Tudum \${(item.platform?.includes('non_english') || item.category.toLowerCase().includes('non-english')) ? '(Pilih Non-English)' : ''}\` : \`Kunjungi \${sourceInfo.shortLabel}\`}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}`
);
fs.writeFileSync('app/data-historis-semua/page.tsx', dataPage);
console.log('Fixed');
