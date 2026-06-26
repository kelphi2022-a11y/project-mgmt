'use client';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('e:/project management app');
const EXTS = ['.tsx', '.ts', '.jsx', '.js'];

function shouldAddUseClient(content) {
  const clientHooks = ['useEffect', 'useState', 'useRouter', 'usePathname', 'useSearchParams'];
  return clientHooks.some(hook => content.includes(hook)) && !content.trimStart().startsWith('"use client"') && !content.trimStart().startsWith("'use client'");
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (shouldAddUseClient(content)) {
    const newContent = `'use client';\n` + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and .next
      if (fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
      walk(fullPath);
    } else {
      if (EXTS.includes(path.extname(entry.name))) {
        processFile(fullPath);
      }
    }
  }
}

walk(ROOT);
